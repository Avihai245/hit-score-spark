/**
 * DemoReport — Public example analysis report
 * Accessible without login from the homepage "See Example Report" CTA.
 * Uses hardcoded realistic data to demonstrate what a real analysis looks like.
 */

import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, Check, X, Zap, Lock } from "lucide-react";

/* ─── Example data: "Midnight Drive" by Alex Carter — Pop, 71/100 ─── */
const DEMO = {
  title: "Midnight Drive",
  artist: "Alex Carter",
  genre: "Pop",
  score: 71,
  verdict:
    "Your track sits at 117 BPM — 3 BPM below the Pop genre average of 120 — and your energy level of 0.66 is 8% under the chart average of 0.72. The hook lands at 0:28, which is 13 seconds past the critical skip-window. These three gaps are costing you algorithmic placement; fix them and this track has genuine chart potential.",
  oneChange:
    "Move your hook earlier — from 0:28 to within the first 0:15. Listeners decide in 7 seconds whether to skip; your current hook arrives 21 seconds too late. This single change could add +14 points to your viral score.",
  oneChangeImpact: 14,
  strengths: [
    "Strong valence score of 0.68 — your track radiates positive, uplifting energy that aligns perfectly with editorial playlist curation for Pop in 2025.",
    "BPM of 117 is within the Pop range (96–132 BPM) and close to the chart average of 120 — your tempo foundation is solid and requires only minor adjustment.",
    "Danceability at 0.71 exceeds the genre average of 0.68, giving you an edge for Spotify algorithmically recommended playlists and TikTok sound virality.",
  ],
  improvements: [
    "Bring your hook forward from 0:28 to 0:13 — this is the single biggest change you can make. Listeners skip at 7 seconds; every second past 0:15 costs you 4% skip-rate.",
    "Increase energy from 0.66 to at least 0.72 (genre avg). Add more drum intensity or synth saturation in the pre-chorus to hit the algorithmic threshold.",
    "Loudness at -8.2 dBFS is 0.8 dB too quiet vs. Spotify's -7.4 dBFS target. A quick limiter pass in mastering can fix this in 10 minutes.",
    "Your intro runs 14 seconds with no melodic hook element. Cut it to 7 seconds or add a signature sound in the first 3 seconds to anchor the listener.",
  ],
  dnaScores: [
    { label: "Hook Strength",      value: 5, max: 10 },
    { label: "Replay Value",       value: 8, max: 10 },
    { label: "Emotional Impact",   value: 7, max: 10 },
    { label: "Structure Quality",  value: 6, max: 10 },
    { label: "Market Fit",         value: 7, max: 10 },
    { label: "Platform Readiness", value: 6, max: 10 },
  ],
  features: [
    { label: "BPM",         songVal: 117, avgVal: 120, minVal: 96,   maxVal: 132,  fmt: (v: number) => `${v}`,    unit: " BPM", scale: [60, 180]  },
    { label: "Energy",      songVal: 0.66, avgVal: 0.72, minVal: null, maxVal: null, fmt: (v: number) => v.toFixed(2), unit: "",    scale: [0, 1]    },
    { label: "Danceability",songVal: 0.71, avgVal: 0.68, minVal: null, maxVal: null, fmt: (v: number) => v.toFixed(2), unit: "",    scale: [0, 1]    },
    { label: "Valence",     songVal: 0.68, avgVal: 0.60, minVal: null, maxVal: null, fmt: (v: number) => v.toFixed(2), unit: "",    scale: [0, 1]    },
  ],
  similarHits: ["Levitating — Dua Lipa", "As It Was — Harry Styles", "Flowers — Miley Cyrus", "Anti-Hero — Taylor Swift"],
  hookTiming: "0:28",
  fingerprint: "pop_117bpm_e7_d7_v7",
};

/* ─── Helpers ─── */
const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(142 71% 45%)";
  return "hsl(270 91% 65%)";
};

const getStatusBadge = (value: number) => {
  if (value >= 8) return { emoji: "✅", label: "Strong",         borderClass: "border-green-500/30",  bgClass: "bg-green-500/[0.05]",  textClass: "text-green-400"  };
  if (value >= 6) return { emoji: "⚠️", label: "Needs Work",    borderClass: "border-yellow-500/30", bgClass: "bg-yellow-500/[0.05]", textClass: "text-yellow-400" };
  return            { emoji: "🔴", label: "Fix This First",  borderClass: "border-red-500/30",    bgClass: "bg-red-500/[0.05]",    textClass: "text-red-400"    };
};

const DNA_DESCRIPTIONS: Record<string, { high: string; mid: string; low: string }> = {
  "Hook Strength":      { high: "Your hook grabs attention within the first 15 seconds — listeners will stay.", mid: `Your hook arrives at ${DEMO.hookTiming} — 13 seconds past the window where listeners decide to skip.`, low: `Your hook arrives at ${DEMO.hookTiming} — most listeners have already skipped by this point.` },
  "Replay Value":       { high: "People will play this on repeat — that drives saves and algorithmic push.", mid: "It's enjoyable, but doesn't quite create the addictive loop that drives replays and playlist adds.", low: "Listeners probably won't come back for a second play — replays are what trigger algorithms." },
  "Emotional Impact":   { high: "The emotional tone connects deeply — this drives saves and social sharing.", mid: "There's feeling here, but the valence of 0.68 needs to be more consistently sustained through the track.", low: "The emotional connection feels flat — add more dynamic contrast between sections." },
  "Structure Quality":  { high: "Your song structure follows the patterns that chart-performing songs use.", mid: "The structure is solid but the BPM of 117 sits 3 BPM below the Pop average — consider a slight tempo lift.", low: "The arrangement feels off — listeners may lose interest before the best parts arrive." },
  "Market Fit":         { high: "This fits what's trending right now — you're in a great lane for discovery.", mid: "You're in the right space but a few tweaks (hook timing, energy level) would put you right in the sweet spot.", low: "This doesn't match what's performing well in your genre right now." },
  "Platform Readiness": { high: "Streaming algorithms will recommend this track — it's optimized for discovery.", mid: "Energy at 0.66 is slightly below the Pop algorithm threshold of 0.72 — a small production boost will help.", low: "This track won't get recommended in its current form — algorithms need stronger energy signals." },
};

/* ─── Score Gauge ─── */
const ScoreGauge = ({ score }: { score: number }) => {
  const r = 50; const dim = 120; const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v: number) => Math.round(v));
  useEffect(() => { const ctrl = animate(count, score, { duration: 2, ease: [0.16, 1, 0.3, 1] }); return ctrl.stop; }, [count, score]);
  return (
    <motion.div className="relative flex items-center justify-center w-[120px] h-[120px]"
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={4} strokeOpacity="0.2" />
        <motion.circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div className="absolute text-center">
        <motion.div className="text-3xl font-black tabular-nums font-heading" style={{ color }}
          initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.4, delay: 1.5 }}>
          {rounded}
        </motion.div>
        <div className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-[0.15em]">Viral Score</div>
      </div>
    </motion.div>
  );
};

/* ─── Section ─── */
const Section = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ delay: Math.min(delay * 0.05, 0.3), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
    {children}
  </motion.section>
);

/* ─── DNA Card ─── */
const DnaCard = ({ dna, index }: { dna: typeof DEMO.dnaScores[number]; index: number }) => {
  const badge = getStatusBadge(dna.value);
  const tier = dna.value >= 8 ? "high" : dna.value >= 6 ? "mid" : "low";
  const description = DNA_DESCRIPTIONS[dna.label]?.[tier] || "This metric affects how your track performs.";
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={`rounded-xl border ${badge.borderClass} ${badge.bgClass} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-bold text-foreground">{dna.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tabular-nums text-foreground">{dna.value}<span className="text-xs text-muted-foreground font-normal">/{dna.max}</span></span>
          <span className={`text-xs font-bold ${badge.textClass}`}>{badge.emoji} {badge.label}</span>
        </div>
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed">{description}</p>
    </motion.div>
  );
};

/* ─── Main DemoReport page ─── */
const DemoReport = () => {
  const { score, title, genre, verdict, oneChange, oneChangeImpact, strengths, improvements, dnaScores, features, similarHits, fingerprint } = DEMO;
  const color = scoreColor(score);

  return (
    <div className="min-h-screen px-4 pt-28 pb-32 bg-background relative">
      {/* Demo banner */}
      <div className="max-w-2xl mx-auto mb-6 relative z-10">
        <div className="rounded-xl border border-accent/30 bg-accent/[0.06] px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 text-accent flex-shrink-0" />
            <p className="text-sm font-semibold text-foreground">
              This is an example report — <span className="text-accent">upload your own song to get a real analysis</span>
            </p>
          </div>
          <Link to="/analyze"
            className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-all">
            <Zap className="h-3 w-3" /> Try Free
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8 relative z-10">

        {/* ═══ HERO ═══ */}
        <Section delay={0}>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-black font-heading text-foreground leading-tight">
                  Strong foundation. One fix away from breaking through.
                </h1>
                <p className="text-sm text-muted-foreground mt-2">"{title}" · {genre}</p>
              </div>
              <div className="flex-shrink-0">
                <ScoreGauge score={score} />
              </div>
            </div>

            {/* #1 fix */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="mt-6 rounded-xl border-2 border-accent/40 bg-accent/[0.06] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-black text-accent uppercase tracking-wider">Your Biggest Opportunity Right Now</span>
              </div>
              <p className="text-base font-bold text-foreground leading-relaxed">{oneChange}</p>
              <p className="text-sm text-accent font-semibold mt-2">→ Estimated impact: +{oneChangeImpact} points on your viral score</p>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
              className="text-xs text-muted-foreground mt-4 text-center">
              Based on patterns from 500K+ tracks · Confidence: 87% · Real Audio Analysis · {genre}
            </motion.p>
          </div>
        </Section>

        {/* ═══ WHY YOU SCORED 71 ═══ */}
        <Section delay={2}>
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">Why You Scored {score}</h2>
          <div className="space-y-3">
            {dnaScores.map((dna, i) => <DnaCard key={dna.label} dna={dna} index={i} />)}
          </div>
        </Section>

        {/* ═══ YOUR SONG VS GENRE DNA ═══ */}
        <Section delay={2.5}>
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">
            Your Song vs. {genre} DNA
          </h2>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 space-y-4">
            {features.map((row) => {
              const [scaleMin, scaleMax] = row.scale;
              const songPct = Math.max(0, Math.min(100, ((row.songVal - scaleMin) / (scaleMax - scaleMin)) * 100));
              const avgPct  = Math.max(0, Math.min(100, ((row.avgVal  - scaleMin) / (scaleMax - scaleMin)) * 100));
              const diff = row.label === "BPM" ? Math.round(row.songVal - row.avgVal) : +(row.songVal - row.avgVal).toFixed(2);
              const isAbove = diff > 0;
              const isClose = Math.abs(diff) < (row.label === "BPM" ? 5 : 0.05);
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{row.label}</span>
                    <span className={`text-xs font-bold ${isClose ? "text-green-400" : isAbove ? "text-blue-400" : "text-orange-400"}`}>
                      {isClose ? "✓ On target" : isAbove ? `+${diff}${row.unit.trim()} above avg` : `${diff}${row.unit.trim()} below avg`}
                    </span>
                  </div>
                  <div className="relative h-5">
                    <div className="absolute inset-0 rounded-full bg-white/5" />
                    {row.minVal != null && row.maxVal != null && (
                      <div className="absolute top-0 bottom-0 rounded-full bg-white/10"
                        style={{ left: `${Math.max(0, ((row.minVal - scaleMin) / (scaleMax - scaleMin)) * 100)}%`, width: `${Math.max(0, ((row.maxVal - row.minVal) / (scaleMax - scaleMin)) * 100)}%` }} />
                    )}
                    <div className="absolute top-0.5 bottom-0.5 w-0.5 bg-white/30 rounded-full"
                      style={{ left: `${avgPct}%`, transform: "translateX(-50%)" }} />
                    <motion.div className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ left: 0 }} initial={{ width: 0 }} whileInView={{ width: `${songPct}%` }}
                      viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>Your song: <span className="text-foreground/80 font-semibold">{row.fmt(row.songVal)}{row.unit}</span></span>
                    <span>Genre avg: <span className="text-foreground/80 font-semibold">{row.fmt(row.avgVal)}{row.unit}</span>
                      {row.minVal != null && row.maxVal != null && <span className="ml-1">(range {row.fmt(row.minVal)}–{row.fmt(row.maxVal)})</span>}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground/40 pt-1 border-t border-border/30">Fingerprint: {fingerprint}</p>
          </div>
        </Section>

        {/* ═══ WHAT'S HOLDING YOU BACK ═══ */}
        <Section delay={3}>
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">What's Holding You Back</h2>
          <div className="space-y-3">
            {improvements.map((imp, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.35 }}
                className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-lg flex-shrink-0">🔴</span>
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {i === 0 ? "Your hook arrives too late" : i === 1 ? "Energy is below chart threshold" : i === 2 ? "Mastering loudness needs adjustment" : "Intro is too long"}
                  </h3>
                </div>
                <div className="pl-8 space-y-2">
                  <p className="text-sm text-foreground/80 leading-relaxed">{imp}</p>
                  <p className="text-sm text-accent font-semibold">→ {i === 0 ? "+14–18 points" : i === 1 ? "+8–12 points" : "+5–8 points"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ═══ WHAT'S WORKING ═══ */}
        <Section delay={4}>
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">What's Already Working For You 💪</h2>
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-green-500/25 bg-green-500/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">✅</span>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{s}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ═══ SIMILAR HITS ═══ */}
        <Section delay={4.5}>
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">Similar Hits in Your Lane</h2>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5">
            <p className="text-xs text-muted-foreground mb-3">Study these tracks — they share your DNA fingerprint and are currently charting.</p>
            <div className="space-y-2">
              {similarHits.map((hit, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-white/[0.02] px-4 py-2.5">
                  <span className="text-xs font-bold text-muted-foreground/50 w-4 flex-shrink-0">{i + 1}</span>
                  <p className="text-sm font-semibold text-foreground flex-1">{hit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ VERDICT ═══ */}
        <Section delay={5}>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6">
            <h2 className="text-lg font-black font-heading text-foreground mb-3">Full Analysis</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">{verdict}</p>
          </div>
        </Section>

        {/* ═══ UPGRADE CTA (locked features) ═══ */}
        <Section delay={6}>
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-primary/10 border border-primary/20">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">Full Report Unlocked With Your Song</span>
            </div>
            <h3 className="text-xl font-black font-heading text-foreground">
              Get a report like this for your track — free
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Upload your song and get a real data-driven score against 500K+ chart hits. See exactly what to fix to maximize streams.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/analyze"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-all">
                <Zap className="h-4 w-4" /> Analyze My Song Free
              </Link>
              <Link to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-all">
                Learn More <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 pt-2">
              {["No credit card", "Real audio analysis", "Instant results"].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-400" />{t}
                </div>
              ))}
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
};

export default DemoReport;
