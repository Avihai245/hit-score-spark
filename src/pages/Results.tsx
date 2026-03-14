import { useLocation, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Target, Music2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(48 96% 53%)";
  return "hsl(142 71% 45%)";
};

const ScoreGauge = ({ score }: { score: number }) => {
  const r = 90;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" className="-rotate-90">
        <circle cx="110" cy="110" r={r} fill="none" stroke="hsl(0 0% 15%)" strokeWidth="10" />
        <motion.circle
          cx="110" cy="110" r={r} fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-5xl font-extrabold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-muted-foreground font-medium mt-1">/ 100</div>
      </div>
    </div>
  );
};

const Results = () => {
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as { results: any; title: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

  const { results, title } = state;
  const { score, verdict, strengths, improvements, oneChange, similarHits, sunoPrompt } = results;

  const copyPrompt = () => {
    navigator.clipboard.writeText(sunoPrompt || "");
    toast({ title: "Copied!", description: "Suno prompt copied to clipboard." });
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `My song "${title}" scored ${score}/100 on HitCheck! 🎵🔥 Check yours at hitcheck.app`
  )}`;

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="container max-w-3xl">
        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <ScoreGauge score={score} />
          <h1 className="mt-6 text-2xl font-bold">{verdict}</h1>
          <p className="mt-1 text-muted-foreground">"{title}"</p>
        </motion.div>

        {/* Strengths / Improvements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid gap-6 md:grid-cols-2"
        >
          <div className="glass-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Check className="h-5 w-5 text-green-400" /> What's Working
            </h2>
            <ul className="space-y-2">
              {(strengths || []).map((s: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground">• {s}</li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <X className="h-5 w-5 text-red-400" /> What to Fix
            </h2>
            <ul className="space-y-2">
              {(improvements || []).map((s: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground">• {s}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* One Change */}
        {oneChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-6"
          >
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5 text-accent" /> The One Change That Matters Most
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{oneChange}</p>
          </motion.div>
        )}

        {/* Similar Hits */}
        {similarHits?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Music2 className="h-5 w-5 text-primary" /> Similar Hits to Study
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {similarHits.map((hit: any, i: number) => (
                <div key={i} className="glass-card p-4">
                  <div className="font-medium">{hit.title}</div>
                  <div className="text-sm text-muted-foreground">{hit.artist}</div>
                  {hit.streams && (
                    <div className="mt-1 text-xs text-accent font-medium">{hit.streams}</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Suno Prompt */}
        {sunoPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <h2 className="mb-3 text-lg font-semibold">🤖 Your Suno Prompt</h2>
            <div className="glass-card relative p-4">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{sunoPrompt}</pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 right-3"
                onClick={copyPrompt}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild className="gradient-purple text-primary-foreground font-semibold glow-purple hover:opacity-90 transition-opacity">
            <Link to="/analyze">Analyze Another Song</Link>
          </Button>
          <Button asChild variant="outline">
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
