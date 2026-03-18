

# Fix 6 Issues on /results Page

## Issue 1: DnaCard descriptions — too technical
**Status**: Partially fixed. The `getDnaDescription` function (line 89) already uses plain language, BUT the `hookAnalysis` prop passes raw API text which can contain technical jargon like "kick on 1+3, snare on 2+4."

**Fix**: In `getDnaDescription`, override the raw `hookAnalysis` string with a clean formula: `"Your hook is strong, but it arrives at [time] — [X] seconds after the window where listeners decide to stay or skip."` Parse timing from the raw string when available. Same for `emotionalCore` — ensure it's always a full sentence.

## Issue 2: Emotional Impact shows fragment like "playful flirtation"
**Status**: Needs fix. When `emotionalCore` is a short label (e.g. "playful flirtation"), the high-tier description just returns it as-is.

**Fix**: In `getDnaDescription` for "Emotional Impact", wrap `emotionalCore` in a full sentence: `"The mood and feeling of your track connects emotionally — this is a real strength for playlist placement."` Never pass raw fragments.

## Issue 3: "You vs Top Tracks" — confusing percentages
**Status**: Needs fix. Lines 1074 and 1085 show `{score}%` and `{avgTopScore}%`.

**Fix**: 
- Change labels to `Your score: {score}/100` and `Top tracks avg: {avgTopScore}/100`
- Add explanation line above bars: "Here's how your track compares to the top performers in your genre:"
- Add genre subtitle: `Genre benchmark: {songGenre || "your genre"} top tracks`
- Remove standalone similar song rows that lack context, or add contextual sentence per song

## Issue 4: Nav has 6 items, should be 4
**Status**: Needs fix. `NAV_ITEMS` (line 218) has 6 items.

**Fix**: Reduce to 4:
- `{ id: "hero", label: "Your Score" }` (merges hero + breakdown)
- `{ id: "holding-back", label: "What to Fix" }` (absorbs vs-top as sub-section)
- `{ id: "working", label: "What's Working" }`
- `{ id: "plan", label: "Your 7-Day Plan" }`

Move the "vs Top Tracks" content into the "What to Fix" section. Remove `id="breakdown"` and `id="vs-top"` as separate scroll targets.

## Issue 5: "What's Working" has no CTA
**Status**: Needs fix. Section ends after green boxes (line 1059).

**Fix**: Add after the strength boxes:
```
"Use these strengths when pitching to playlists."
[→ See Your 7-Day Plan for how] (anchor link to #plan)
```

## Issue 6: Day 1-2 generic text + small CTA
**Status**: Needs fix. Lines 1138-1147 show generic `oneChange` text and a small outlined button.

**Fix**:
- Replace text with: `"Move your hook to 0:07. Right now it hits at 0:38 — that's 31 seconds after most listeners have already decided to skip. Use AI Remix to shift it automatically."`
- Make button full-width, solid accent/orange gradient, larger padding
- Add subtitle under button: `"Takes 2 minutes · adds an estimated {oneChangeImpact}–{oneChangeImpact+5} points"`

## Technical Details

**File**: `src/pages/Results.tsx` — single file, all changes

**Changes by line range**:
1. Lines 89-124: Rewrite `getDnaDescription` to sanitize hookAnalysis (strip jargon, use formula), and wrap emotionalCore fragments in full sentences
2. Lines 218-225: Reduce `NAV_ITEMS` from 6 to 4
3. Lines 982-993: Remove separate `id="breakdown"` section header, merge into hero section
4. Lines 1063-1123: Move vs-top content into the holding-back section as a sub-section
5. Lines 1037-1061: Add CTA link after strength boxes
6. Lines 1134-1148: Rewrite Day 1-2 text and make button full-width primary style with subtitle

