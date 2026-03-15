import json
import boto3
import os
import base64
import urllib.request
import time
import re
from openai import OpenAI

s3_client = boto3.client('s3', region_name='eu-west-1', endpoint_url='https://s3.eu-west-1.amazonaws.com', config=__import__('botocore').config.Config(signature_version='s3v4', s3={'addressing_style': 'virtual'}))
openai_client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
lambda_client = boto3.client('lambda', region_name='eu-west-1')

BUCKET = 'hitcheck-audio-uploads'
SUNO_API_KEY = os.environ.get('SUNO_API_KEY', '')
SUNO_API_BASE = 'https://api.sunoapi.org'

SPOTIFY_PLAYLISTS = [
    {"name": "Fresh Finds", "followers": "1.2M", "genre": ["indie", "alternative", "electronic"]},
    {"name": "New Music Friday", "followers": "6M", "genre": ["all"]},
    {"name": "Pollen", "followers": "1.1M", "genre": ["indie", "electronic"]},
    {"name": "Dance Rising", "followers": "2M", "genre": ["dance", "house", "electronic"]},
    {"name": "Sad Beats", "followers": "2.4M", "genre": ["indie", "r&b"]},
    {"name": "Bedroom Pop", "followers": "1.8M", "genre": ["indie", "pop"]},
    {"name": "Electronic Rising", "followers": "900K", "genre": ["house", "electronic"]},
    {"name": "mint", "followers": "3M", "genre": ["pop"]},
    {"name": "Radar", "followers": "800K", "genre": ["all"]},
    {"name": "Chill Vibes", "followers": "4M", "genre": ["chill", "ambient"]},
]

def match_playlists(genre=''):
    g = genre.lower()
    matched = []
    for p in SPOTIFY_PLAYLISTS:
        if 'all' in p['genre'] or any(pg in g or g in pg for pg in p['genre']):
            matched.append({"name": p['name'], "followers": p['followers']})
    return matched[:5]

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    }

    print(f"EVENT: {json.dumps(event)[:500]}")

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'analyze')
        print(f"ACTION: {action}")

        # ===== GET PRESIGNED S3 UPLOAD URL =====
        if action == 'get-upload-url':
            file_name = body.get('fileName', 'song.mp3')
            safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', file_name)
            key = f"uploads/{int(time.time() * 1000)}-{safe_name}"
            upload_url = s3_client.generate_presigned_url(
                'put_object',
                Params={'Bucket': BUCKET, 'Key': key},
                ExpiresIn=300
            )
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'uploadUrl': upload_url, 's3Key': key})}

        # ===== POLL JOB STATUS =====
        if action == 'poll':
            job_id = body.get('jobId')
            return poll_job(job_id, headers)

        # ===== START ASYNC ANALYSIS =====
        if action == 'analyze':
            s3_key = body.get('s3Key')
            title = body.get('title', 'Unknown')
            genre = body.get('genre', 'Unknown')

            if not s3_key:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'No s3Key'})}

            job_id = f"job-{int(time.time() * 1000)}"
            print(f"Creating job: {job_id}")

            s3_client.put_object(
                Bucket=BUCKET,
                Key=f"results/{job_id}.json",
                Body=json.dumps({'status': 'processing', 'jobId': job_id}),
                ContentType='application/json'
            )

            lambda_client.invoke(
                FunctionName=context.function_name,
                InvocationType='Event',
                Payload=json.dumps({
                    'httpMethod': 'POST',
                    'body': json.dumps({
                        'action': 'run-analysis',
                        'jobId': job_id,
                        's3Key': s3_key,
                        'title': title,
                        'genre': genre
                    })
                })
            )

            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'status': 'processing', 'jobId': job_id})}

        # ===== RUN ACTUAL ANALYSIS (called async) =====
        if action == 'run-analysis':
            job_id = body.get('jobId')
            s3_key = body.get('s3Key')
            title = body.get('title', 'Unknown')
            genre = body.get('genre', 'Unknown')
            print(f"Running analysis for job: {job_id}, s3Key: {s3_key}")

            try:
                result = do_analyze(s3_key, title, genre)
                result['status'] = 'complete'
                result['jobId'] = job_id

                # Clean control characters
                def clean_obj(v):
                    if isinstance(v, str):
                        return ''.join(c for c in v if ord(c) >= 32 or c in '\n\r\t')
                    if isinstance(v, list): return [clean_obj(i) for i in v]
                    if isinstance(v, dict): return {k: clean_obj(val) for k, val in v.items()}
                    return v
                result = clean_obj(result)

                s3_client.put_object(
                    Bucket=BUCKET,
                    Key=f"results/{job_id}.json",
                    Body=json.dumps(result, ensure_ascii=False),
                    ContentType='application/json'
                )
                print(f"Job {job_id} complete, score: {result.get('score')}")
            except Exception as e:
                print(f"Analysis error for {job_id}: {str(e)}")
                s3_client.put_object(
                    Bucket=BUCKET,
                    Key=f"results/{job_id}.json",
                    Body=json.dumps({'status': 'error', 'error': str(e), 'jobId': job_id}),
                    ContentType='application/json'
                )
            return {'statusCode': 200, 'headers': headers, 'body': '{}'}

        # ===== SUNO COVER =====
        if action == 'suno-cover':
            print(f'suno-cover body: taskId={body.get("taskId")} s3Key={body.get("s3Key")}')
            return handle_suno_cover(body, headers)

        print(f"Unknown action: {action}")
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': f'Unknown action: {action}'})}

    except Exception as e:
        print(f"TOP ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}


def poll_job(job_id, headers):
    try:
        response = s3_client.get_object(Bucket=BUCKET, Key=f"results/{job_id}.json")
        data = json.loads(response['Body'].read().decode('utf-8'))
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(data)}
    except Exception as e:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'status': 'processing', 'jobId': job_id, 'note': str(e)})}


def do_analyze(s3_key, title, genre):
    matched_playlists = match_playlists(genre)
    s3_response = s3_client.get_object(Bucket=BUCKET, Key=s3_key)
    audio_data = s3_response['Body'].read()
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    ext = s3_key.split('.')[-1].lower() if '.' in s3_key else 'mp3'
    audio_format = 'wav' if ext == 'wav' else 'mp3'

    # Don't delete - user may want AI Remix after analysis
    analysis = analyze_with_gpt4o_audio(audio_base64, audio_format, title, genre, matched_playlists)
    analysis['matchedPlaylists'] = matched_playlists
    return analysis


# Genre-specific data for accurate analysis
GENRE_BENCHMARKS = {
    "pop": {
        "viral": [("Anti-Hero","Taylor Swift","1.8B","hook 0:00, universal relatable truth"),("As It Was","Harry Styles","2.7B","BPM 174, melancholic+danceable"),("Stay","The Kid LAROI","2B","hook every 30s")],
        "algo": "Save rate >28% = algorithm push. Hook in first 7s = 3x saves. 2:30-3:00 optimal length.",
        "hook_benchmark": "0:00-0:07", "bpm_range": "100-140",
        "playlists": "New Music Friday → mint → Pop Rising"
    },
    "melodic house": {
        "viral": [("Nevermind","Dennis Lloyd","800M","one word hook, emotional depth"),("i think i am addicted","oskar med k","44M","hook 0:00, 125BPM, physical imagery"),("La Femme","Dennis Lloyd","60M","groove first 10s")],
        "algo": "4-on-floor kick = algorithm boost. 120-128 BPM sweet spot. Save rate >35% in this genre.",
        "hook_benchmark": "0:00-0:15", "bpm_range": "118-128",
        "playlists": "Electronic Rising → Dance Rising → Pollen"
    },
    "hip hop": {
        "viral": [("Rich Flex","Drake","1.2B","ad-lib became the hook"),("HUMBLE","Kendrick","1.7B","simple beat complex message"),("Rockstar","Post Malone","1.5B","minor key, dark energy")],
        "algo": "Hook repetition 3x minimum. Flow variation in verse = retention. 80-100 BPM for mainstream.",
        "hook_benchmark": "0:00-0:20", "bpm_range": "80-140",
        "playlists": "Rap Caviar → Most Necessary → Feelin Myself"
    },
    "r&b": {
        "viral": [("Golden","JVKE","500M","piano + emotional peak"),("Snooze","SZA","400M","vulnerability + texture"),("Cuff It","Beyonce","600M","nostalgic energy")],
        "algo": "Save rate highest in R&B. Vocal run at 1:30 mark increases saves 40%. Bridge variation critical.",
        "hook_benchmark": "0:00-0:20", "bpm_range": "65-100",
        "playlists": "Sad Beats → R&B Vibes → Soul"
    },
    "indie pop": {
        "viral": [("Heather","Conan Gray","500M","specific memory narrative"),("That's So True","Gracie Abrams","600M","funny+painful=shareable"),("Glimpse of Us","Joji","1B","sparse production raw emotion")],
        "algo": "Bedroom aesthetic = Fresh Finds discovery. Lyrics > production in this genre. Specific > generic.",
        "hook_benchmark": "0:00-0:30", "bpm_range": "90-130",
        "playlists": "Fresh Finds → Bedroom Pop → Pollen"
    },
    "afrobeats": {
        "viral": [("Love Nwantiti","CKay","900M","simple melody, feel over language"),("Essence","Wizkid","500M","groove locks first 10s"),("Woman","Rema","400M","afrofusion crossover")],
        "algo": "TikTok dance content critical. Percussion at 0:30 = retention spike. 95-115 BPM.",
        "hook_benchmark": "0:00-0:15", "bpm_range": "95-115",
        "playlists": "Afro Nation → African Heat → Global Hits"
    },
    "electronic": {
        "viral": [("Midnight City","M83","600M","sax hook at 3:30 = unexpected"),("Strobe","deadmau5","200M","build patience"),("Clarity","Zedd","1B","drop timing perfect")],
        "algo": "Drop timing at 1:00-1:30 = max retention. Filter sweep before drop = Shazam spike.",
        "hook_benchmark": "0:00-1:30 (drop)", "bpm_range": "128-140",
        "playlists": "Dance Rising → Electronic Rising → Beast Mode"
    }
}

def get_genre_context(genre):
    g = genre.lower()
    for key in GENRE_BENCHMARKS:
        if key in g or g in key:
            return GENRE_BENCHMARKS[key]
    return GENRE_BENCHMARKS.get("pop")  # default

def analyze_with_gpt4o_audio(audio_base64, audio_format, title, genre, playlists):
    playlist_names = ', '.join([p['name'] for p in playlists])
    gc = get_genre_context(genre)
    
    viral_refs = '\n'.join([f'  - "{t[0]}" by {t[1]} ({t[2]} streams): {t[3]}' for t in gc['viral']])

    prompt = f"""You are THE world's best hit song analyst with deep knowledge of Spotify's algorithm and what makes songs viral in 2025-2026.

LISTEN carefully to every second of this song. Give SPECIFIC analysis based on what you actually hear.

Song title: "{title}"
Genre: "{genre}"
Target playlists: {playlist_names}

GENRE BENCHMARK DATA for {genre}:
Top viral hits in this genre:
{viral_refs}
Algorithm signals: {gc['algo']}
Hook benchmark: first hook should appear at {gc['hook_benchmark']}
BPM sweet spot: {gc['bpm_range']}
Playlist path: {gc['playlists']}

Compare this song DIRECTLY against these benchmarks. Be brutally honest.

Return ONLY valid JSON (no markdown, no code blocks, start with {{ end with }}):
{{
  "score": <0-100>,
  "verdict": "<one direct sentence to the artist>",
  "hookTiming": "<e.g. 0:18>",
  "bpmEstimate": "<e.g. 124 BPM>",
  "musicalKey": "<e.g. F# minor>",
  "energyLevel": "<low/medium/high>",
  "energyDescription": "<how energy moves>",
  "openingLyrics": "<first 1-2 lines heard>",
  "songTheme": "<what the song is about>",
  "emotionalCore": "<core emotion>",
  "viralLine": "<the one line that could go viral, or none yet>",
  "lyricWeakness": "<weakest lyric moment>",
  "lyricFix": "<specific: change X to something like Y>",
  "valence": <0-10>,
  "danceability": <0-10>,
  "saveRatePrediction": "<will people save this and why>",
  "skipRiskMoment": "<at what second people might skip and why>",
  "targetAudience": "<who listens to this>",
  "listeningMoment": "<when/where they listen>",
  "tikTokFit": "<what TikTok content fits>",
  "similarSongs": [
    {{"title": "", "artist": "", "streams": "", "whatTheyHaveThatYouDont": ""}},
    {{"title": "", "artist": "", "streams": "", "whatTheyHaveThatYouDont": ""}},
    {{"title": "", "artist": "", "streams": "", "whatTheyHaveThatYouDont": ""}}
  ],
  "strengths": ["<specific>", "<specific>", "<specific>"],
  "improvements": ["<specific fix>", "<specific fix>", "<specific fix>"],
  "hookAnalysis": "<detailed hook analysis>",
  "oneChange": "<most impactful specific change>",
  "algorithmFit": "<why Spotify will or won't push this>",
  "playlistStrategy": "<which playlists and why>",
  "viralPotential": "<honest assessment based on genre benchmarks above>",
  "genreScore": "<how well this fits the genre conventions 0-100>",
  "vocalGender": "<male or female or mixed>",
  "vocalStyle": "<describe: e.g. breathy soft male vocals, powerful female R&B>",
  "originalLyrics": "<write ALL lyrics you can hear verbatim - every line of every verse, pre-chorus, chorus, bridge>",
  "improvedLyrics": "<rewrite: same structure, same vibe, strengthen hook, fix weak lines, keep viral line - make it sound like a hit>",
  "originalLyrics": "<write ALL lyrics you can hear verbatim - every line of every verse and chorus>",
  "improvedLyrics": "<rewrite the lyrics: keep same structure and emotional vibe, strengthen the hook, fix the weakest line, keep the viral line>",
  "dataSource": "real_audio_analysis"
}}"""

    response = openai_client.chat.completions.create(
        model='gpt-4o-audio-preview',
        messages=[{
            'role': 'user',
            'content': [
                {'type': 'input_audio', 'input_audio': {'data': audio_base64, 'format': audio_format}},
                {'type': 'text', 'text': prompt}
            ]
        }],
        max_tokens=2000
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith('```'):
        raw = raw.split('```')[1]
        if raw.startswith('json'):
            raw = raw[4:]
    raw = raw.strip()
    result = json.loads(raw)
    result['analyzedAt'] = __import__('datetime').datetime.utcnow().isoformat()
    result['songTitle'] = title
    return result


def handle_suno_cover(body, headers):
    try:
        s3_key = body.get('s3Key')
        title = body.get('title', 'Unknown')
        genre = body.get('genre', 'pop')
        custom_style = body.get('style', '')
        task_id = body.get('taskId')
        analysis = body.get('analysisData', {}) or {}

        if task_id:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(poll_suno_task(task_id))}

        if not s3_key:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'No s3Key'})}

        # Use public S3 URL directly - bucket has public read policy for uploads/
        presigned_url = f"https://{BUCKET}.s3.eu-west-1.amazonaws.com/{s3_key}"
        print(f"Public S3 URL: {presigned_url[:80]}")

        style_map = {
            'pop': 'upbeat pop, catchy hook, radio-ready, modern production',
            'indie pop': 'indie pop, dreamy, layered vocals, bedroom pop energy',
            'r&b': 'smooth r&b, sultry vocals, modern trap-soul, groove',
            'hip hop': 'modern hip hop, hard hitting beats, melodic rap',
            'melodic house': 'melodic house, emotional, driving bassline, euphoric drop',
            'electronic': 'electronic, synth-driven, pulsing energy, dance floor',
            'rock': 'indie rock, driving guitars, anthemic, powerful chorus',
        }
        base_style = style_map.get(genre.lower(), 'modern pop, catchy, radio-ready, viral potential')
        
        # Extract all analysis data FIRST before building style
        bpm = analysis.get('bpmEstimate', '')
        key = analysis.get('musicalKey', '')
        hook_time = analysis.get('hookTiming', '')
        one_change = analysis.get('oneChange', '')
        viral_line = analysis.get('viralLine', '')
        original_lyrics = analysis.get('originalLyrics', '')
        improved_lyrics = analysis.get('improvedLyrics', '')

        # STYLE = ONLY musical tags joined by commas
        vocal_gender_tag = ''
        vg = analysis.get('vocalGender', '').lower()
        if 'female' in vg and 'male' not in vg:
            vocal_gender_tag = 'female vocals'
        elif 'male' in vg and 'female' not in vg:
            vocal_gender_tag = 'male vocals'

        vs = analysis.get('vocalStyle', '')
        bpm_tag = bpm.replace(' BPM', '').replace(' bpm', '') + 'bpm' if bpm else ''
        key_tag = key if key else ''

        style_parts = [p for p in [vocal_gender_tag, vs, base_style, bpm_tag, key_tag, custom_style] if p]
        style_prompt = ', '.join(style_parts)

        # PROMPT = ONLY the lyrics (what Suno will sing)
        if improved_lyrics:
            full_prompt = improved_lyrics[:4000]
        elif original_lyrics:
            full_prompt = original_lyrics[:4000]
        elif viral_line and viral_line != 'none yet':
            full_prompt = viral_line
        else:
            full_prompt = ''
        
        print(f"Suno lyrics prompt ({len(full_prompt)} chars): {full_prompt[:100]}")
        
        # Model: V5 for faithful remakes (best quality), V4_5ALL for big style changes
        style_lower = (custom_style or '').lower()
        is_style_change = any(w in style_lower for w in ['energetic', 'danceable', 'radio', 'crossover'])
        suno_model = "V4_5ALL" if is_style_change else "V5"
        
        suno_payload = {
            "customMode": True, "instrumental": False,
            "style": style_prompt,
            "title": f"{title} (AI Remix)"[:100],
            "prompt": full_prompt,
            "uploadUrl": presigned_url, "model": suno_model, "callBackUrl": "https://httpbin.org/post"
        }
        print(f"Suno prompt: {full_prompt[:150]}")
        req = urllib.request.Request(
            f"{SUNO_API_BASE}/api/v1/generate/upload-cover",
            data=json.dumps(suno_payload).encode('utf-8'),
            headers={
                'Authorization': f'Bearer {SUNO_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://sunoapi.org',
                'Referer': 'https://sunoapi.org/'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            suno_response = json.loads(response.read().decode('utf-8'))

        task_id = suno_response.get('data', {}).get('taskId') or suno_response.get('taskId')
        if not task_id:
            return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'No taskId', 'raw': suno_response})}

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'status': 'processing', 'taskId': task_id})}

    except Exception as e:
        print(f"Suno cover EXCEPTION: {str(e)}")
        import traceback; traceback.print_exc()
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}


def poll_suno_task(task_id):
    try:
        req = urllib.request.Request(
            f"{SUNO_API_BASE}/api/v1/generate/record-info?taskId={task_id}",
            headers={
                'Authorization': f'Bearer {SUNO_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://sunoapi.org',
                'Referer': 'https://sunoapi.org/'
            },
            method='GET'
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))

        task_data = data.get('data') or {}
        if not task_data:
            return {'status': 'processing', 'taskId': task_id}
        status = task_data.get('status', 'unknown').upper()
        suno_data_len = len(((task_data.get('response') or {}) or {}).get('sunoData') or [])
        print(f'Suno poll result: status={status}, sunoData={suno_data_len}')
        has_audio = any(t.get('audioUrl') or t.get('sourceAudioUrl') for t in ((task_data.get('response') or {}).get('sunoData') or []))
        if (status in ('SUCCESS', 'COMPLETE', 'COMPLETED') or suno_data_len > 0) and has_audio:
            suno_data = ((task_data.get('response') or {}).get('sunoData') or [])
            if suno_data:
                # Mirror audio to our S3 bucket for CORS-free playback
                mirrored = []
                for track in suno_data[:2]:  # max 2 tracks
                    original_url = track.get('sourceAudioUrl') or track.get('audioUrl') or ''
                    if not original_url:
                        continue
                    try:
                        # Download from Suno CDN
                        req = urllib.request.Request(original_url,
                            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'},
                            method='GET')
                        with urllib.request.urlopen(req, timeout=30) as r:
                            audio_bytes = r.read()
                        # Upload to S3
                        s3_key_out = f"remixes/{task_id}-{track.get('id','track')[:8]}.mp3"
                        s3_client.put_object(
                            Bucket=BUCKET,
                            Key=s3_key_out,
                            Body=audio_bytes,
                            ContentType='audio/mpeg'
                        )
                        public_url = f"https://{BUCKET}.s3.eu-west-1.amazonaws.com/{s3_key_out}"
                        print(f"Mirrored to S3: {public_url}")
                    except Exception as me:
                        print(f"Mirror failed, using original: {me}")
                        public_url = original_url
                    
                    mirrored.append({**track, 'url': public_url, 'audioUrl': public_url})
                
                return {'status': 'complete', 
                        'audioUrl': mirrored[0]['url'],
                        'imageUrl': mirrored[0].get('imageUrl'),
                        'title': mirrored[0].get('title'),
                        'tracks': mirrored}
        if status in ('FAILED', 'ERROR'):
            return {'status': 'failed', 'error': 'Suno processing failed'}
        return {'status': 'processing', 'taskId': task_id}
    except Exception as e:
        print(f'poll_suno_task EXCEPTION: {str(e)}')
        import traceback
        traceback.print_exc()
        return {'status': 'error', 'error': str(e)}
