import { useLocation, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Target, Music2, Copy, ListMusic, Lightbulb, Zap, Clock, Activity, Database, Flame, Headphones } from "lucide-react";
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
          className="text-6xl font-black tracking-tight"
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

const Results = () => {
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as { results: any; title: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

  const { results, title } = state;
  const {
    score, verdict, strengths, improvements, oneChange,
    hookTiming, bpmEstimate, energyLevel, dataSource,
    hookAnalysis, viralPotential,
    matchedPlaylists, playlistStrategy, sunoPrompt,
  } = results;

  const copyPrompt = () => {
    navigator.clipboard.writeText(sunoPrompt || "");
    toast({ title: "Copied!", description: "Suno prompt copied to clipboard." });
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `My song "${title}" scored ${score}/100 on HitCheck! 🎵🔥 Check yours at hitcheck.app`
  )}`;

  const isRealAudio = dataSource === "real_audio_analysis";

  const audioStats = [
    { icon: Clock, label: "Hook Timing", value: hookTiming },
    { icon: Activity, label: "BPM Estimate", value: bpmEstimate },
    { icon: Zap, label: "Energy Level", value: energyLevel },
    {
      icon: isRealAudio ? Headphones : Database,
      label: "Data Source",
      value: isRealAudio ? "🎧 Real Audio Analysis" : "📊 Genre Estimate",
    },
  ].filter((f) => f.value != null);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 },
  });

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="container max-w-4xl space-y-12">

        {/* 1. SCORE */}
        <motion.div {...fade(0)} className="flex flex-col items-center text-center">
          <ScoreGauge score={score} />
        </motion.div>

        {/* 2. VERDICT */}
        <motion.div {...fade(0.2)} className="text-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{verdict}</h1>
          <p className="mt-2 text-muted-foreground text-lg">"{title}"</p>
        </motion.div>

        {/* 3. AUDIO ANALYSIS */}
        {audioStats.length > 0 && (
          <motion.section {...fade(0.3)}>
            <SectionHeader emoji="🔊" title="AUDIO ANALYSIS" delay={0.3} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* 4. WHAT'S WORKING */}
        {strengths?.length > 0 && (
          <motion.section {...fade(0.4)}>
            <SectionHeader emoji="✅" title="WHAT'S WORKING" delay={0.4} />
            <div className="glass-card p-6 space-y-3">
              {strengths.map((s: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" />
                  </div>
                  <span className="text-sm text-foreground/80">{s}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 5. WHAT TO FIX */}
        {improvements?.length > 0 && (
          <motion.section {...fade(0.5)}>
            <SectionHeader emoji="❌" title="WHAT TO FIX" delay={0.5} />
            <div className="glass-card p-6 space-y-3">
              {improvements.map((s: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="h-3 w-3 text-red-400" />
                  </div>
                  <span className="text-sm text-foreground/80">{s}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 6. THE ONE CHANGE */}
        {oneChange && (
          <motion.section {...fade(0.6)}>
            <SectionHeader emoji="🎯" title="THE ONE CHANGE THAT MATTERS" delay={0.6} />
            <div className="rounded-xl border-2 border-accent/40 bg-accent/10 p-6 glow-gold">
              <div className="flex items-start gap-4">
                <Target className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-foreground font-medium leading-relaxed">{oneChange}</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* 7. HOOK ANALYSIS */}
        {hookAnalysis && (
          <motion.section {...fade(0.65)}>
            <SectionHeader emoji="🎵" title="HOOK ANALYSIS" delay={0.65} />
            <div className="glass-card p-6">
              <p className="text-sm text-foreground/80 leading-relaxed">{hookAnalysis}</p>
            </div>
          </motion.section>
        )}

        {/* 8. VIRAL POTENTIAL */}
        {viralPotential && (
          <motion.section {...fade(0.7)}>
            <SectionHeader emoji="🚀" title="VIRAL POTENTIAL" delay={0.7} />
            <div className="glass-card p-6 border-primary/20">
              <p className="text-sm text-foreground/80 leading-relaxed">{viralPotential}</p>
            </div>
          </motion.section>
        )}

        {/* 9. SPOTIFY PLAYLIST STRATEGY */}
        {(playlistStrategy || matchedPlaylists?.length > 0) && (
          <motion.section {...fade(0.75)}>
            <SectionHeader emoji="📋" title="SPOTIFY PLAYLIST STRATEGY" delay={0.75} />

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
                {matchedPlaylists.map((pl: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className="glass-card p-5 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ListMusic className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{pl.name}</span>
                    </div>
                    {pl.followers && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {pl.followers} followers
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Suno Prompt */}
        {sunoPrompt && (
          <motion.section {...fade(0.85)}>
            <SectionHeader emoji="🤖" title="YOUR SUNO PROMPT" delay={0.85} />
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

        {/* Actions */}
        <motion.div {...fade(0.9)} className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button asChild className="gradient-purple text-primary-foreground font-semibold glow-purple hover:opacity-90 transition-opacity px-8 h-12 text-base">
            <Link to="/analyze">Analyze Another Song</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-8 text-base">
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
              Share on 𝕏
            </a>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
