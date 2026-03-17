import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  Headphones, BarChart3, Target, Users, FileText, CalendarDays,
  Zap, ArrowRight, Activity, Music, TrendingUp, Layers, Brain,
  Radio, Repeat, Timer, BarChart2, Sparkles,
} from "lucide-react";

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ from, to, duration = 2, suffix = "" }: { from: number; to: number; duration?: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) {
      const ctrl = animate(count, to, { duration, ease: "easeOut" });
      return ctrl.stop;
    }
  }, [isInView, count, to, duration]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

/* ─── Live incrementing counter ─── */
const LiveCounter = () => {
  const [count, setCount] = useState(50247);
  useEffect(() => {
    const interval = setInterval(() => setCount(c => c + 1), 2400);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm"
    >
      <motion.div
        className="w-2 h-2 rounded-full bg-emerald-400"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      <span className="text-sm font-bold text-foreground tabular-nums">
        {count.toLocaleString()}
      </span>
      <span className="text-sm text-muted-foreground">tracks analyzed globally</span>
    </motion.div>
  );
};

/* ─── Floating Waveform Background ─── */
const WaveformBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Radial gradient */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(258_90%_66%_/0.06),transparent_60%)]" />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-[160px]" />
    {/* Animated waveform bars */}
    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[3px] h-64 opacity-[0.04]">
      {Array.from({ length: 80 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={{ height: [`${15 + Math.random() * 40}%`, `${30 + Math.random() * 60}%`, `${15 + Math.random() * 40}%`] }}
          transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: i * 0.05, ease: "easeInOut" }}
        />
      ))}
    </div>
    {/* Data flow particles */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/20"
        style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 20}%` }}
        animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.3 }}
      />
    ))}
  </div>
);

/* ─── Platform references ─── */
const PlatformRow = () => {
  const platforms = [
    { name: "Spotify", color: "#1DB954" },
    { name: "Apple Music", color: "#FC3C44" },
    { name: "TikTok", color: "hsl(var(--foreground))" },
    { name: "YouTube", color: "#FF0000" },
    { name: "Global Charts", color: "hsl(var(--primary))" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {platforms.map((p, i) => (
        <span key={p.name} className="text-[11px] font-medium opacity-40" style={{ color: p.color }}>
          {i > 0 && <span className="mr-2 text-border">•</span>}
          {p.name}
        </span>
      ))}
    </div>
  );
};

const socialProofStats = [
  { value: "50,000+", label: "Tracks Analyzed", icon: Music },
  { value: "10,000+", label: "Artists Improved", icon: Users },
  { value: "+25%", label: "Avg Viral Improvement", icon: TrendingUp },
  { value: "67", label: "Countries", icon: Radio },
];

const dataEngineFeatures = [
  { icon: Layers, title: "Structure Pattern Analysis", desc: "Maps your song's structure against thousands of top-performing tracks across all major platforms." },
  { icon: Timer, title: "Hook Timing Detection", desc: "Detects exactly when your hook hits and compares timing against viral benchmarks." },
  { icon: Repeat, title: "Replay Behavior Modeling", desc: "Predicts replay rates using engagement signals from high-performing tracks." },
  { icon: Brain, title: "Retention Intelligence", desc: "Identifies listener drop-off risks and optimizes your track for maximum retention." },
  { icon: TrendingUp, title: "Market Trend Analysis", desc: "Analyzes current genre trends, playlist patterns, and algorithmic preferences in real-time." },
  { icon: BarChart2, title: "Cross-Platform Benchmarking", desc: "Scores your track against performance data from Spotify, Apple Music, TikTok and YouTube." },
];

const steps = [
  { num: "01", title: "Upload Your Track", desc: "Drag & drop any MP3 or WAV file. No account needed for your first analysis.", icon: "🎵", metric: "Accepted: MP3, WAV up to 100MB" },
  { num: "02", title: "Global Pattern Analysis", desc: "Our engine compares your song against data patterns from top-performing tracks across platforms.", icon: "🧠", metric: "Comparing against 500K+ hit patterns" },
  { num: "03", title: "Optimize for Viral", desc: "Get your viral score, detailed breakdown, and prioritized improvements to maximize your streams.", icon: "🚀", metric: "Average analysis time: ~90 seconds" },
];

const viralFeatures = [
  { icon: Headphones, color: "text-primary", title: "Real Audio Intelligence", desc: "Our AI listens to your actual audio — detecting BPM, hook timing, and emotional energy using real frequency analysis." },
  { icon: BarChart3, color: "text-accent", title: "Algorithm Readiness Score", desc: "We evaluate your save rate, skip risk, valence and danceability against the exact signals streaming algorithms use." },
  { icon: Target, color: "text-primary", title: "Competitor DNA Match", desc: "See which hit tracks share your DNA — and discover exactly what separates them from your song." },
  { icon: Users, color: "text-accent", title: "Audience Intelligence", desc: "Discover who will listen, when, and what content formats match your sound for maximum discovery." },
  { icon: FileText, color: "text-primary", title: "Lyric Analysis & Fix", desc: "Your weakest lyric moment identified with a specific AI-suggested replacement to boost impact." },
  { icon: CalendarDays, color: "text-accent", title: "30-Day Release Roadmap", desc: "A week-by-week data-driven action plan based on your score, goal, and genre — ready to execute." },
];

const testimonials = [
  { quote: "I was about to release a 58/100 song. Viralize showed me one fix. Rereleased at 84. Now at 2M streams.", handle: "@axelbeats", metric: "+26 point improvement" },
  { quote: "The competitor match blew my mind. I found out exactly which hit songs my track resembles and what to fix.", handle: "@lunawave", metric: "3 hit matches found" },
  { quote: "Saved me $300 in SubmitHub submissions by knowing exactly who to target.", handle: "@sonicpilot", metric: "ROI: 100x" },
];

const pricingPreview = [
  { name: "Free", price: "$0", features: ["1 analysis / month", "Hit score (0–100)", "3 improvement tips", "Strengths & weaknesses"], highlighted: false },
  { name: "Pay As You Go", price: "$2.99", period: "/song", features: ["Full analysis report", "AI Remix — $6.99", "Download MP3 & WAV", "No subscription"], highlighted: false },
  { name: "Pro", price: "$29", period: "/mo", badge: "MOST POPULAR", features: ["Unlimited analyses", "4 AI Hit Remixes/month", "Competitor DNA Match", "Playlist Targeting", "30-Day Roadmap", "Priority processing"], highlighted: true },
  { name: "Studio", price: "$49", period: "/mo", features: ["Everything in Pro", "8 AI Hit Remixes/month", "Advanced vocal tuning", "Multi-style remixes", "Priority support"], highlighted: false },
];

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.6 },
});

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex flex-col items-center justify-center min-h-[100svh] px-4 text-center overflow-hidden pt-32 pb-16">
        <WaveformBackground />

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
            <span>Global Music Intelligence Engine — Active</span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-heading tracking-tight text-foreground leading-[1.05] max-w-5xl"
        >
          Turn Your Track Into a
          <br />
          <span className="gradient-text">Viral Hit</span> Using
          <br />
          <span className="brand-gradient-text">Global Music Data</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative mt-5 text-lg md:text-xl font-medium text-muted-foreground max-w-2xl leading-relaxed"
        >
          Analyze your music against real-world hit patterns, identify what's holding it back, and optimize it for algorithmic success.
        </motion.p>

        {/* Platform row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative mt-4">
          <PlatformRow />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button asChild size="lg" className="relative gradient-purple text-primary-foreground px-10 py-7 text-lg font-bold glow-purple hover:opacity-90 transition-all overflow-hidden">
              <Link to="/analyze" className="flex items-center gap-2">
                Analyze Your Track
                <motion.span animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>🔥</motion.span>
              </Link>
            </Button>
          </motion.div>
          <Button asChild size="lg" variant="outline" className="px-8 py-7 text-base font-semibold border-border hover:bg-secondary hover:border-muted-foreground/30 transition-all">
            <Link to="/results" className="flex items-center gap-2">
              See How It Works <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Live counter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="relative mt-12">
          <LiveCounter />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-border flex items-start justify-center p-1"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ SOCIAL PROOF STATS ═══════════ */}
      <section className="border-t border-border/50 py-16 px-4 bg-background">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {socialProofStats.map((stat, i) => (
              <motion.div key={stat.label} {...fade(i * 0.08)} className="text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2 opacity-60" />
                <p className="text-3xl md:text-4xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DATA ENGINE SECTION ═══════════ */}
      <section className="py-24 px-4 bg-background">
        <div className="container max-w-5xl">
          <motion.div {...fade(0)} className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-4">
              <Brain className="h-3 w-3" /> The Engine
            </span>
          </motion.div>
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-black font-heading mb-3 text-foreground">
            What Our Data Engine Analyzes
          </motion.h2>
          <motion.p {...fade(0.05)} className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">
            Six intelligence layers working simultaneously to decode your track's viral potential against global hit patterns.
          </motion.p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dataEngineFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                {...fade(i * 0.06)}
                className="glass-card p-6 hover:border-primary/20 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold font-heading mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="border-t border-border/50 py-24 px-4 bg-background">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-black font-heading mb-16 text-foreground">
            How It Works
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                {...fade(i * 0.1)}
                className="glass-card p-8 text-center hover:border-primary/20 transition-all group relative overflow-hidden"
              >
                <span className="absolute top-4 right-4 text-5xl font-black text-foreground/[0.03] font-heading">{step.num}</span>
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-4xl font-black brand-gradient-text mb-3">{step.num}</div>
                <h3 className="text-lg font-bold font-heading mb-2 text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                <span className="inline-block text-[10px] text-primary/60 font-medium uppercase tracking-wider bg-primary/5 px-2.5 py-1 rounded-full">
                  {step.metric}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EVERYTHING YOU NEED ═══════════ */}
      <section className="py-24 px-4 bg-background">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-black font-heading mb-4 text-foreground">
            Data-Driven Tools to Go Viral
          </motion.h2>
          <motion.p {...fade(0.05)} className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Six powerful analysis tools backed by global benchmarks to maximize your streams.
          </motion.p>
          <div className="grid gap-5 sm:grid-cols-2">
            {viralFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                {...fade(i * 0.08)}
                className="glass-card p-6 hover:border-primary/20 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <f.icon className={`h-8 w-8 ${f.color} mb-4 transition-transform group-hover:scale-110`} />
                <h3 className="font-bold font-heading mb-2 text-foreground text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="border-t border-border/50 py-24 px-4 bg-background">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-black font-heading mb-16 text-foreground">
            Artists Trust Our Data
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.handle} {...fade(i * 0.1)} className="glass-card p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t.metric}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed italic flex-1">"{t.quote}"</p>
                <p className="mt-4 text-sm font-bold text-primary">{t.handle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING PREVIEW ═══════════ */}
      <section className="py-24 px-4 bg-background">
        <div className="container max-w-6xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-black font-heading mb-4 text-foreground">
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p {...fade(0.05)} className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Start free. Pay only when you're ready. One viral hit pays for itself 100x over.
          </motion.p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingPreview.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...fade(i * 0.08)}
                className={`glass-card p-7 flex flex-col ${plan.highlighted ? "border-primary/40 glow-purple xl:scale-[1.03] z-10 relative" : ""}`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-purple px-4 py-1 text-[11px] font-black text-primary-foreground tracking-wider shadow-lg shadow-primary/30">
                    ⭐ {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold font-heading text-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={plan.highlighted ? "text-primary" : "text-emerald-400"}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`mt-8 w-full font-semibold ${plan.highlighted ? "gradient-purple text-primary-foreground glow-purple hover:opacity-90 transition-opacity" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link to="/pricing">
                    {plan.highlighted ? "Get Pro" : plan.name === "Free" ? "Start Free" : "See Plans"}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="border-t border-border/50 py-24 px-4 text-center bg-background">
        <motion.div {...fade(0)} className="container max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-6">
            <Activity className="h-3 w-3" /> System Ready
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-heading mb-4 text-foreground">
            Ready to analyze your <span className="gradient-text">hit potential</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Upload your track and get data-driven insights in 90 seconds. No credit card needed.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button asChild size="lg" className="gradient-purple text-primary-foreground px-10 py-7 text-lg font-bold glow-purple hover:opacity-90 transition-opacity">
              <Link to="/analyze" className="flex items-center gap-2">
                Analyze Your Track Free
                <motion.span animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>🔥</motion.span>
              </Link>
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            Based on patterns from 500K+ top-performing tracks
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
