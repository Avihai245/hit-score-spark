import { useLocation, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Target, Copy, ListMusic, Lightbulb, Clock, Activity, Zap, Headphones, Database, Music, User, AlertTriangle, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(48 96% 53%)";
  return "hsl(142 71% 45%)";
};

const ScoreGauge = ({ score }: { score: number }) => {
  const r = 100;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-56 h-56 rounded-full blur-3xl" style={{ backgroundColor: `${color}15` }} />
      <svg width="260" height="260" className="-rotate-90">
        <circle cx="130" cy="130" r={r} fill="none" stroke="hsl(0 0% 12%)" strokeWidth="12" />
        <motion.circle
          cx="130" cy="130" r={r} fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-7xl font-black tracking-tight"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        >
          {score}
        </motion.div>
        <div className="text-sm text-muted-foreground font-medium mt-1">/ 100</div>
      </div>
    </div>
  );
};

const MiniGauge = ({ label, value, max, color = "hsl(var(--primary))" }: { label: string; value: number; max: number; color?: string }) => {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(0 0% 12%)" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute mt-5 text-sm font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground font-medium text-center mt-1">{label}</div>
    </div>
  );
};

const SectionHeader = ({ emoji, title, delay = 0 }: { emoji: string; title: string; delay?: number }) => (
  <motion.h2
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center gap-3 text-xl font-bold mb-5"
  >
    <span className="text-2xl">{emoji}</span> {title}
  </motion.h2>
);

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.5 },
});

const generateRoadmap = (score: number, goal: string) => {
  if (score >= 75) {
    return [
      { week: "Week 1", action: "Finalize master & upload to distributor. Create pre-save link." },
      { week: "Week 2", action: "Submit to Spotify editorial playlists. Pitch to 10 independent curators." },
      { week: "Week 3", action: "Release day: post 3 TikTok clips using the hook. Email your list." },
      { week: "Week 4", action: "Run $50 Instagram/TikTok ads targeting similar artist fans. Pitch Round 2 curators." },
    ];
  }
  return [
    { week: "Week 1", action: "Apply the suggested improvements. Re-record or remix the weak sections." },
    { week: "Week 2", action: "Re-analyze with HitCheck. Aim for 75+ before proceeding." },
    { week: "Week 3", action: "Once score is strong, set up pre-save and begin curator outreach." },
    { week: "Week 4", action: "Release and promote across all channels. Track Spotify for Artists data daily." },
  ];
};

const Results = () => {
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as { results: any; title: string; goal?: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

  const { results, title, goal } = state;
  const {
    score, verdict, strengths, improvements, oneChange,
    hookTiming, bpmEstimate, energyLevel, dataSource, openingLyrics,
    hookAnalysis, viralPotential, competitorMatch,
    matchedPlaylists, playlistStrategy, sunoPrompt,
    musicalKey,
    // New fields
    songTheme, emotionalCore, viralLine,
    lyricWeakness, lyricFix,
    targetAudience, listeningMoment, tikTokFit,
    valence, danceability, saveRatePrediction, skipRiskMoment,
    similarSongs,
  } = results;

  const isRealAudio = dataSource === "real_audio_analysis";

  const copyPrompt = () => {
    navigator.clipboard.writeText(sunoPrompt || "");
    toast({ title: "Copied!", description: "Suno prompt copied to clipboard." });
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `My song "${title}" scored ${score}/100 on HitCheck! 🎵🔥 Check yours at hitcheck.app`
  )}`;

  const roadmap = generateRoadmap(score, goal || "streams");

  const audioStats = [
    { icon: Clock, label: "Hook Timing", value: hookTiming },
    { icon: Activity, label: "BPM", value: bpmEstimate },
    { icon: KeyRound, label: "Key", value: musicalKey },
    { icon: Zap, label: "Energy Level", value: energyLevel },
    { icon: Music, label: "Opening Lyrics", value: openingLyrics },
  ].filter((f) => f.value != null);

  const hasViralLine = viralLine && viralLine !== "none yet";

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="container max-w-4xl space-y-14">

        {/* 1. SCORE */}
        <motion.div {...fade(0)} className="flex flex-col items-center text-center">
          <ScoreGauge score={score} />
        </motion.div>

        {/* 2. VERDICT */}
        <motion.div {...fade(0.2)} className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{verdict}</h1>
          <p className="text-lg text-muted-foreground">"{title}"</p>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border border-border bg-card">
            {isRealAudio ? (
              <><Headphones className="h-4 w-4 text-primary" /> 🎧 Real Audio Analysis</>
            ) : (
              <><Database className="h-4 w-4 text-muted-foreground" /> 📊 Genre Estimate</>
            )}
          </div>
        </motion.div>

        {/* SONG IDENTITY */}
        {(songTheme || emotionalCore || viralLine) && (
          <motion.section {...fade(0.22)}>
            <SectionHeader emoji="🎭" title="SONG IDENTITY" delay={0.22} />
            <div className="glass-card p-6 space-y-4">
              {songTheme && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Theme</span>
                  <p className="text-sm text-foreground/90 mt-1">{songTheme}</p>
                </div>
              )}
              {emotionalCore && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Emotional Core</span>
                  <p className="text-sm text-foreground/90 mt-1">{emotionalCore}</p>
                </div>
              )}
              {viralLine != null && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Viral Line</span>
                  {hasViralLine ? (
                    <p className="text-base font-bold text-accent mt-1 glow-gold inline-block px-3 py-1 rounded-lg border border-accent/30 bg-accent/10">
                      "{viralLine}"
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 italic">No standout viral line detected yet</p>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* COMPETITOR MATCH */}
        {competitorMatch && (
          <motion.section {...fade(0.25)}>
            <SectionHeader emoji="🎤" title="COMPETITOR MATCH" delay={0.25} />
            <div className="rounded-xl border-2 border-accent/40 bg-accent/5 p-6 glow-gold">
              <p className="text-lg font-bold mb-4">
                Your song sounds like {competitorMatch.artist} at {competitorMatch.matchPercent}%
              </p>
              {competitorMatch.differences?.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {competitorMatch.differences.map((d: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-accent">•</span> {d}
                    </li>
                  ))}
                </ul>
              )}
              {competitorMatch.insight && (
                <p className="text-sm text-foreground/70 italic">{competitorMatch.insight}</p>
              )}
            </div>
          </motion.section>
        )}

        {/* DETAILED ANALYSIS */}
        {audioStats.length > 0 && (
          <motion.section {...fade(0.3)}>
            <SectionHeader emoji="🔊" title="DETAILED ANALYSIS" delay={0.3} />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {audioStats.map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card p-5 text-center space-y-2 hover:border-primary/20 transition-colors"
                >
                  <stat.icon className="h-5 w-5 mx-auto text-primary" />
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div className="text-lg font-bold">{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* SPOTIFY SCORE */}
        {(valence != null || danceability != null || saveRatePrediction || skipRiskMoment) && (
          <motion.section {...fade(0.35)}>
            <SectionHeader emoji="💚" title="SPOTIFY SCORE" delay={0.35} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {valence != null && (
                <div className="glass-card p-5 flex flex-col items-center relative">
                  <MiniGauge label="Valence" value={valence} max={10} color="hsl(142 71% 45%)" />
                  <div className="text-xs text-muted-foreground mt-1">/ 10</div>
                </div>
              )}
              {danceability != null && (
                <div className="glass-card p-5 flex flex-col items-center relative">
                  <MiniGauge label="Danceability" value={danceability} max={10} color="hsl(var(--primary))" />
                  <div className="text-xs text-muted-foreground mt-1">/ 10</div>
                </div>
              )}
              {saveRatePrediction && (
                <div className="glass-card p-5 text-center space-y-2">
                  <div className="text-3xl font-black text-primary">{saveRatePrediction}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Save Rate</div>
                </div>
              )}
              {skipRiskMoment && (
                <div className="glass-card p-5 text-center space-y-2 border-destructive/30">
                  <AlertTriangle className="h-5 w-5 mx-auto text-destructive" />
                  <div className="text-sm font-bold text-destructive">{skipRiskMoment}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Skip Risk</div>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* STRENGTHS + IMPROVEMENTS */}
        <motion.div {...fade(0.4)} className="grid gap-6 md:grid-cols-2">
          {strengths?.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                <span>✅</span> What's Working
              </h2>
              <div className="glass-card p-6 space-y-3">
                {strengths.map((s: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                    <span className="text-sm text-foreground/80">{s}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {improvements?.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                <span>❌</span> What to Fix
              </h2>
              <div className="glass-card p-6 space-y-3">
                {improvements.map((s: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X className="h-3 w-3 text-red-400" />
                    </div>
                    <span className="text-sm text-foreground/80">{s}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* LYRICS FEEDBACK */}
        {(lyricWeakness || lyricFix) && (
          <motion.section {...fade(0.45)}>
            <SectionHeader emoji="✍️" title="LYRICS FEEDBACK" delay={0.45} />
            <div className="glass-card p-6 space-y-4">
              {lyricWeakness && (
                <div>
                  <span className="text-xs text-destructive uppercase tracking-wider font-bold">Weakest moment</span>
                  <p className="text-sm text-foreground/80 mt-1 italic">"{lyricWeakness}"</p>
                </div>
              )}
              {lyricFix && (
                <div>
                  <span className="text-xs text-green-400 uppercase tracking-wider font-bold">Suggested fix</span>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                      <div className="text-xs text-destructive font-bold mb-1">BEFORE</div>
                      <p className="text-sm text-foreground/70">{lyricWeakness || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                      <div className="text-xs text-green-400 font-bold mb-1">AFTER</div>
                      <p className="text-sm text-foreground/90">{lyricFix}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* THE ONE CHANGE */}
        {oneChange && (
          <motion.section {...fade(0.5)}>
            <SectionHeader emoji="🎯" title="THE ONE CHANGE THAT MATTERS" delay={0.5} />
            <div className="rounded-xl border-2 border-accent/40 bg-accent/10 p-6 glow-gold">
              <div className="flex items-start gap-4">
                <Target className="h-7 w-7 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-lg text-foreground font-semibold leading-relaxed">{oneChange}</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* HOOK ANALYSIS */}
        {hookAnalysis && (
          <motion.section {...fade(0.55)}>
            <SectionHeader emoji="🎵" title="HOOK ANALYSIS" delay={0.55} />
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 flex items-center gap-0.5 pr-4">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-primary"
                    style={{ height: `${20 + Math.sin(i * 0.5) * 60 + Math.random() * 20}%` }}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed relative z-10">{hookAnalysis}</p>
            </div>
          </motion.section>
        )}

        {/* AUDIENCE PROFILE */}
        {(targetAudience || listeningMoment || tikTokFit) && (
          <motion.section {...fade(0.57)}>
            <SectionHeader emoji="👤" title="AUDIENCE PROFILE" delay={0.57} />
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground/70">Your ideal listener</span>
              </div>
              {targetAudience && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Who</span>
                  <p className="text-sm text-foreground/90 mt-1">{targetAudience}</p>
                </div>
              )}
              {listeningMoment && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">When they listen</span>
                  <p className="text-sm text-foreground/90 mt-1">{listeningMoment}</p>
                </div>
              )}
              {tikTokFit && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">TikTok Fit</span>
                  <p className="text-sm text-foreground/90 mt-1">{tikTokFit}</p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* SIMILAR SONGS THAT WORKED */}
        {similarSongs?.length > 0 && (
          <motion.section {...fade(0.6)}>
            <SectionHeader emoji="🏆" title="SIMILAR SONGS THAT WORKED" delay={0.6} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarSongs.slice(0, 3).map((song: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                  className="glass-card p-5 hover:border-accent/30 transition-colors space-y-3"
                >
                  <div>
                    <div className="font-bold text-sm">{song.title}</div>
                    <div className="text-xs text-muted-foreground">{song.artist}</div>
                  </div>
                  {song.streams && (
                    <div className="text-xs text-accent font-semibold">{song.streams} streams</div>
                  )}
                  {song.whatTheyHaveThatYouDont && (
                    <div>
                      <span className="text-xs text-muted-foreground italic">What they have that you don't:</span>
                      <p className="text-sm text-foreground/80 mt-1">{song.whatTheyHaveThatYouDont}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 30-DAY ROADMAP */}
        <motion.section {...fade(0.65)}>
          <SectionHeader emoji="📅" title="30-DAY RELEASE ROADMAP" delay={0.65} />
          <div className="space-y-4">
            {roadmap.map((item, i) => (
              <motion.div
                key={item.week}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="glass-card p-5 flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-20 text-sm font-bold text-primary">{item.week}</div>
                <p className="text-sm text-foreground/80">{item.action}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SPOTIFY PLAYLIST TARGETS */}
        {(playlistStrategy || matchedPlaylists?.length > 0) && (
          <motion.section {...fade(0.75)}>
            <SectionHeader emoji="📋" title="SPOTIFY PLAYLIST TARGETS" delay={0.75} />
            {playlistStrategy && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{playlistStrategy}</p>
                </div>
              </div>
            )}
            {matchedPlaylists?.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matchedPlaylists.slice(0, 5).map((pl: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className="glass-card p-5 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ListMusic className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{pl.name}</span>
                    </div>
                    {pl.followers && (
                      <p className="text-xs text-muted-foreground">{pl.followers} followers</p>
                    )}
                    {pl.reason && (
                      <p className="text-xs text-primary/70 mt-1">{pl.reason}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* VIRAL POTENTIAL */}
        {viralPotential && (
          <motion.section {...fade(0.85)}>
            <SectionHeader emoji="🚀" title="VIRAL POTENTIAL" delay={0.85} />
            <div className="glass-card p-6 border-primary/20">
              <p className="text-sm text-foreground/80 leading-relaxed">{viralPotential}</p>
            </div>
            <div className="mt-4 flex justify-center">
              <Button asChild variant="outline" className="gap-2">
                <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                  Share your score on 𝕏
                </a>
              </Button>
            </div>
          </motion.section>
        )}

        {/* Suno Prompt */}
        {sunoPrompt && (
          <motion.section {...fade(0.9)}>
            <SectionHeader emoji="🤖" title="YOUR SUNO PROMPT" delay={0.9} />
            <div className="glass-card relative p-6">
              <pre className="whitespace-pre-wrap text-sm text-foreground/70 leading-relaxed font-sans">
                {sunoPrompt}
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 hover:bg-primary/10"
                onClick={copyPrompt}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </motion.section>
        )}

        {/* Bottom CTA */}
        <motion.div {...fade(0.95)} className="text-center space-y-4 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="gradient-purple text-primary-foreground font-bold glow-purple hover:opacity-90 transition-opacity px-10 h-14 text-lg">
              <Link to="/analyze">Analyze Another Song</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            <Link to="/pricing" className="text-accent hover:underline font-medium">
              Upgrade to Pro for unlimited analyses →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
