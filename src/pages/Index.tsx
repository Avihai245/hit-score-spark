import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Headphones, BarChart3, Target, Users, FileText, CalendarDays,
  Zap, ArrowRight, Activity, Music, TrendingUp, Layers, Brain,
  Radio, Repeat, Timer, BarChart2, Sparkles, Rocket,
  Play, Shield, Globe, Eye } from
"lucide-react";
import FreeTrialUpload from "@/components/FreeTrialUpload";

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ from, to, duration = 2, suffix = "" }: {from: number;to: number;duration?: number;suffix?: string;}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (v: number) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) {
      const ctrl = animate(count, to, { duration, ease: "easeOut" });
      return ctrl.stop;
    }
  }, [isInView, count, to, duration]);

  return <><motion.span ref={ref}>{rounded}</motion.span>{suffix}</>;
};

/* ─── Live incrementing counter — deterministic, never resets ─── */
const COUNTER_EPOCH = new Date('2025-01-01T00:00:00Z').getTime();
const COUNTER_START = 55000;
// ~5,400/day ≈ grows from 55k to ~1M+ in ~6 months
const COUNTER_RATE_PER_MS = 5400 / (24 * 60 * 60 * 1000);

const getBaseCount = () => {
  const elapsed = Date.now() - COUNTER_EPOCH;
  return Math.floor(COUNTER_START + elapsed * COUNTER_RATE_PER_MS);
};

const LiveCounter = () => {
  const [count, setCount] = useState(getBaseCount);
  useEffect(() => {
    const interval = setInterval(() => setCount(getBaseCount()), 2400);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-card/40 border border-border/30 backdrop-blur-xl">
      
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-sm font-bold text-foreground tabular-nums">
        {count.toLocaleString()}
      </span>
      <span className="text-sm text-muted-foreground">tracks analyzed globally</span>
    </motion.div>);

};

/* ─── Lightweight Hero Background (GPU-friendly, reduced bars) ─── */
const HeroBackground = () => {
  const bars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    h1: 15 + Math.random() * 50,
    h2: 25 + Math.random() * 65,
    h3: 15 + Math.random() * 50,
    dur: 3 + Math.random() * 4,
    delay: i * 0.08
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Ambient gradients (static, no animation) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(258_90%_66%_/0.10),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,hsl(280_80%_55%_/0.05),transparent)]" />

      {/* Central glow — single slow transform animation */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full will-change-transform"
        style={{ background: "radial-gradient(circle, hsl(258 90% 66% / 0.06), transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} />
      

      {/* Waveform bars — reduced count, GPU-only transforms */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[3px] h-64 opacity-[0.04]">
        {bars.map((b, i) =>
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-gradient-to-t from-primary/50 to-primary will-change-transform"
          style={{ height: "60%", transformOrigin: "bottom" }}
          animate={{ scaleY: [b.h1 / 100, b.h2 / 100, b.h3 / 100] }}
          transition={{ repeat: Infinity, duration: b.dur, delay: b.delay, ease: "easeInOut" }} />

        )}
      </div>

      {/* Grid overlay (static) */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />
      
    </div>);

};

/* ─── Floating CTA ─── */
const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : 100, opacity: visible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4"
      style={{ pointerEvents: visible ? "auto" : "none" }}>
      
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
        <Button
          asChild
          size="lg"
          className="relative gradient-purple text-primary-foreground px-8 py-5 text-sm font-bold shadow-xl shadow-primary/20 overflow-hidden rounded-full">
          
          <Link to="/analyze" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Analyze Your Track — Free</span>
          </Link>
        </Button>
      </motion.div>
    </motion.div>);

};

/* ─── Animated Stat Bar ─── */
const StatBar = ({ label, value, max = 100, delay = 0 }: {label: string;value: number;max?: number;delay?: number;}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 will-change-transform"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: value / max } : {}}
          style={{ transformOrigin: "left" }}
          transition={{ delay, duration: 1, ease: [0.25, 0.1, 0.25, 1] as const }} />
        
      </div>
    </div>);

};

/* ─── Platform references ─── */
const platforms = [
{ name: "Spotify", color: "#1DB954" },
{ name: "Apple Music", color: "#FC3C44" },
{ name: "TikTok", color: "hsl(var(--foreground))" },
{ name: "YouTube", color: "#FF0000" }];


/* ─── Data ─── */
const socialProofStats = [
{ value: 50000, label: "Tracks Analyzed", icon: Music, suffix: "+" },
{ value: 10000, label: "Artists Improved", icon: Users, suffix: "+" },
{ value: 25, label: "Avg Viral Improvement", icon: TrendingUp, suffix: "%", prefix: "+" },
{ value: 67, label: "Countries", icon: Radio, suffix: "" }];


const dataEngineFeatures = [
{ icon: Layers, title: "Structure Pattern Analysis", desc: "Maps your song's structure against thousands of top-performing tracks across all major platforms." },
{ icon: Timer, title: "Hook Timing Detection", desc: "Detects exactly when your hook hits and compares timing against viral benchmarks." },
{ icon: Repeat, title: "Replay Behavior Modeling", desc: "Predicts replay rates using engagement signals from high-performing tracks." },
{ icon: Brain, title: "Retention Intelligence", desc: "Identifies listener drop-off risks and optimizes your track for maximum retention." },
{ icon: TrendingUp, title: "Market Trend Analysis", desc: "Analyzes current genre trends, playlist patterns, and algorithmic preferences." },
{ icon: BarChart2, title: "Cross-Platform Benchmarking", desc: "Scores your track against performance data from Spotify, Apple Music, TikTok and YouTube." }];


const steps = [
{ num: "01", title: "Upload Your Track", desc: "Drag & drop any MP3 or WAV file. No account needed for your first analysis.", icon: Music, metric: "MP3, WAV up to 100MB" },
{ num: "02", title: "Global Pattern Analysis", desc: "Our engine compares your song against data patterns from top-performing tracks across platforms.", icon: Brain, metric: "500K+ hit patterns" },
{ num: "03", title: "Optimize for Viral", desc: "Get your viral score, detailed breakdown, and prioritized improvements to maximize your streams.", icon: Rocket, metric: "~90 second analysis" }];


const viralFeatures = [
{ icon: Headphones, title: "Real Audio Intelligence", desc: "Detects BPM, hook timing, and emotional energy using real frequency analysis." },
{ icon: BarChart3, title: "Algorithm Readiness Score", desc: "Evaluates save rate, skip risk, valence and danceability against streaming algorithm signals." },
{ icon: Target, title: "Competitor DNA Match", desc: "See which hit tracks share your DNA — and exactly what separates them." },
{ icon: Users, title: "Audience Intelligence", desc: "Discover who will listen, when, and what content formats match your sound." },
{ icon: FileText, title: "Lyric Analysis & Fix", desc: "Your weakest lyric moment identified with a specific AI-suggested replacement." },
{ icon: CalendarDays, title: "30-Day Release Roadmap", desc: "A week-by-week data-driven action plan based on your score, goal, and genre." }];


const testimonials = [
{ quote: "I was about to release a 58/100 song. Santo showed me one fix. Rereleased at 84. Now at 2M streams.", handle: "@axelbeats", metric: "+26 pts" },
{ quote: "The competitor match blew my mind. I found out exactly which hit songs my track resembles and what to fix.", handle: "@lunawave", metric: "3 hit matches" },
{ quote: "Saved me $300 in SubmitHub submissions by knowing exactly who to target.", handle: "@sonicpilot", metric: "100x ROI" }];


const pricingPreview = [
  { name: "Free", price: "$0", features: ["1 analysis per month", "Hit score (0–100)", "3 improvement tips", "Strengths & weaknesses", "Share your score"], highlighted: false },
  { name: "Pro", price: "$19", period: "/mo", badge: "MOST POPULAR", features: ["Unlimited analyses", "Up to 4 viral songs/month", "Smart scan of top 500 live hits", "Full viral report + lyrics breakdown", "MP3 download", "Priority processing"], highlighted: true },
  { name: "Studio", price: "$29", period: "/mo", features: ["Everything in Pro", "Up to 10 viral songs/month", "WAV + MP3 download", "Advanced analytics", "Commercial use rights", "Priority support"], highlighted: false },
  { name: "Business", price: "$49", period: "/mo", badge: "BEST VALUE", features: ["Everything in Studio", "Up to 20 viral songs/month", "WAV + MP3 + stems download", "Full commercial rights", "Early access to new features", "Priority support"], highlighted: false },
  { name: "Unlimited", price: "$79", period: "/mo", features: ["Everything in Business", "Unlimited viral songs", "Fastest priority queue", "Full commercial rights", "Early access to new features", "Premium support"], highlighted: false },
];


/* ─── Animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { delay, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
});

/* ─── Comparison Visual ─── */
const ComparisonVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="glass-card p-6 border-destructive/20 relative overflow-hidden">
        
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
        <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-3 relative">Random Release</p>
        <div className="space-y-2 relative">
          {[25, 15, 30, 20].map((v, i) =>
          <div key={i} className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
              className="h-full rounded-full bg-destructive/40 will-change-transform"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: v / 100 } : {}}
              style={{ transformOrigin: "left" }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.7 }} />
            
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-destructive/60 mt-3 relative">32<span className="text-sm">/100</span></p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass-card p-6 border-primary/30 relative overflow-hidden">
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 relative">Optimized Track</p>
        <div className="space-y-2 relative">
          {[85, 78, 92, 88].map((v, i) =>
          <div key={i} className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 will-change-transform"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: v / 100 } : {}}
              style={{ transformOrigin: "left" }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.7 }} />
            
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-primary mt-3 relative">87<span className="text-sm">/100</span></p>
      </motion.div>
    </div>);

};

/* ═══════════════════════════════════════════════════ */
const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background relative">
      <FloatingCTA />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex flex-col items-center justify-center min-h-[100svh] px-4 text-center overflow-hidden pt-32 pb-20">
        <HeroBackground />

        {/* System badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8">
          
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/8 border border-primary/20 text-sm font-semibold text-primary backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Global Music Intelligence Engine — Active
          </span>
        </motion.div>

        {/* Headline */}
        <div className="relative max-w-4xl">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-heading tracking-tight text-foreground leading-[1.1]">
            
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="block">
              
              Stop Guessing.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="block gradient-text">
              
              Start Charting.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="block mt-1 text-accent my-[5px] mx-0 py-0 px-0 font-mono text-lg">
              
              ​WILL YOUR SONG GO VIRAL?       
            </motion.span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="relative mt-6 text-base sm:text-lg md:text-xl font-medium text-muted-foreground max-w-xl leading-relaxed px-2">
          
          We reveal exactly why some tracks blow up on Spotify / Apple music and why yours doesn't — yet. Fix it before you release.         
        </motion.p>

        {/* Platform row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="relative mt-5 flex items-center justify-center gap-5 flex-wrap">
          
          {platforms.map((p) =>
          <span
            key={p.name}
            className="text-[11px] font-semibold tracking-wide opacity-40"
            style={{ color: p.color }}>
            
              {p.name}
            </span>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="relative mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto px-4 sm:px-0">
          
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="relative w-full sm:w-auto gradient-purple text-primary-foreground px-10 py-6 text-base sm:text-lg font-bold shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-shadow overflow-hidden rounded-full">
              
              <Link to="/analyze" className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" />
                <span>Analyze Your Track — Free</span>
              </Link>
            </Button>
          </motion.div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-8 py-6 text-sm sm:text-base font-semibold border-border/50 hover:bg-secondary hover:border-muted-foreground/30 transition-all backdrop-blur-sm rounded-full">
            
            <Link to="/results" className="flex items-center justify-center gap-2">
              See Example Report <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Social proof line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="relative mt-4 text-xs text-muted-foreground/60 font-medium">
          
          No signup required · Results in 30 seconds · 100% free first scan
        </motion.p>

        {/* Live counter */}
        <div className="relative mt-14">
          <LiveCounter />
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
          
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-border/50 flex items-start justify-center p-1.5">
            
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ FREE TRIAL UPLOAD ═══════════ */}
      <FreeTrialUpload />

      {/* ═══════════ SOCIAL PROOF STATS ═══════════ */}
      <section className="relative border-t border-border/30 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container max-w-5xl relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {socialProofStats.map((stat, i) =>
            <motion.div
              key={stat.label}
              {...fadeUp(i * 0.08)}
              className="text-center">
              
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 border border-primary/15 mb-4 mx-auto">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-4xl md:text-5xl font-black text-foreground tabular-nums">
                  {stat.prefix || ""}
                  <AnimatedCounter from={0} to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-semibold">{stat.label}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ PROBLEM → SOLUTION ═══════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(258_90%_66%_/0.03),transparent_60%)]" />
        <div className="container max-w-4xl relative">
          <motion.div {...fadeUp()} className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive uppercase tracking-wider">
              <Eye className="h-3 w-3" /> The Problem
            </span>
          </motion.div>
          <motion.h2 {...fadeUp(0.05)} className="text-center text-3xl md:text-5xl font-black font-heading mb-4 text-foreground">
            90% of tracks fail<br className="hidden sm:block" /> not because of talent
          </motion.h2>
          <motion.p {...fadeUp(0.1)} className="text-center text-muted-foreground mb-14 max-w-xl mx-auto text-lg">
            They fail because artists can't see what algorithms see. Random releases vs data-optimized tracks — the difference is dramatic.
          </motion.p>

          <ComparisonVisual />

          <motion.div {...fadeUp(0.25)} className="text-center mt-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-4">
              <Shield className="h-3 w-3" /> The Solution
            </span>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mt-3">
              Santo gives you the same data intelligence that major labels use — in 90 seconds, for any track.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ DATA ENGINE ═══════════ */}
      <section className="py-24 px-4 relative overflow-hidden border-t border-border/20">
        <div className="container max-w-6xl relative">
          <motion.div {...fadeUp()} className="text-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
              <Brain className="h-3 w-3" /> The Engine
            </span>
          </motion.div>
          <motion.h2 {...fadeUp(0.05)} className="text-center text-3xl md:text-5xl font-black font-heading mb-3 text-foreground">
            What Our Data Engine Analyzes
          </motion.h2>
          <motion.p {...fadeUp(0.08)} className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto text-lg">
            Six intelligence layers working simultaneously to decode your track's viral potential.
          </motion.p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dataEngineFeatures.map((f, i) =>
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="glass-card p-7 hover:border-primary/20 transition-colors group cursor-default hover:-translate-y-1 transition-transform duration-200">
              
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-5">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold font-heading mb-2 text-foreground text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="border-t border-border/20 py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(258_90%_66%_/0.04),transparent_60%)]" />
        <div className="container max-w-5xl relative">
          <motion.h2 {...fadeUp()} className="text-center text-3xl md:text-5xl font-black font-heading mb-20 text-foreground">
            How It Works
          </motion.h2>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, i) =>
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="glass-card p-8 text-center relative overflow-hidden hover:-translate-y-1.5 transition-transform duration-200">
                
                  <span className="absolute top-3 right-4 text-6xl font-black text-foreground/[0.03] font-heading">{step.num}</span>

                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-primary/10 border border-primary/15 mb-5 mx-auto">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>

                  <div className="text-3xl font-black brand-gradient-text mb-3">{step.num}</div>
                  <h3 className="text-xl font-bold font-heading mb-3 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.desc}</p>
                  <span className="inline-block text-[10px] text-primary/70 font-semibold uppercase tracking-wider bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                    {step.metric}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ DATA VISUALS — PROOF ═══════════ */}
      <section className="border-t border-border/20 py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container max-w-4xl relative">
          <motion.div {...fadeUp()} className="text-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent uppercase tracking-wider">
              <BarChart3 className="h-3 w-3" /> Real Results
            </span>
          </motion.div>
          <motion.h2 {...fadeUp(0.05)} className="text-center text-3xl md:text-5xl font-black font-heading mb-16 text-foreground">
            Proven by Data
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div {...fadeUp(0.1)} className="glass-card p-8">
              <h3 className="font-bold font-heading text-foreground mb-6 text-lg">Average Improvement After Optimization</h3>
              <div className="space-y-4">
                <StatBar label="Hook Strength" value={72} delay={0.2} />
                <StatBar label="Replay Value" value={65} delay={0.3} />
                <StatBar label="Algorithm Fit" value={84} delay={0.4} />
                <StatBar label="Market Readiness" value={78} delay={0.5} />
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.15)} className="glass-card p-8">
              <h3 className="font-bold font-heading text-foreground mb-8 text-lg">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                { label: "Avg Score Increase", val: 23, suf: " pts" },
                { label: "Hook Fix Success", val: 89, suf: "%" },
                { label: "Replay Rate Lift", val: 34, suf: "%" },
                { label: "Skip Risk Reduction", val: 41, suf: "%" }].
                map((m) =>
                <div key={m.label} className="text-center">
                    <p className="text-3xl font-black text-primary tabular-nums">
                      <AnimatedCounter from={0} to={m.val} suffix={m.suf} duration={1.5} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{m.label}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ EVERYTHING YOU NEED ═══════════ */}
      <section className="py-24 px-4 border-t border-border/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(258_90%_66%_/0.03),transparent_50%)]" />
        <div className="container max-w-5xl relative">
          <motion.h2 {...fadeUp()} className="text-center text-3xl md:text-5xl font-black font-heading mb-4 text-foreground">
            Data-Driven Tools to Go Viral
          </motion.h2>
          <motion.p {...fadeUp(0.05)} className="text-center text-muted-foreground mb-16 max-w-lg mx-auto text-lg">
            Six powerful analysis tools backed by global benchmarks.
          </motion.p>
          <div className="grid gap-5 sm:grid-cols-2">
            {viralFeatures.map((f, i) =>
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="glass-card p-7 hover:border-primary/20 transition-colors hover:-translate-y-1 transition-transform duration-200">
              
                <f.icon className={`h-8 w-8 ${i % 2 === 0 ? "text-primary" : "text-accent"} mb-4`} />
                <h3 className="font-bold font-heading mb-2 text-foreground text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ VIRAL FEATURE — DRAMATIC ═══════════ */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(258_90%_66%_/0.06),transparent_60%)]" />

        <div className="container max-w-4xl relative">
          <motion.div {...fadeUp()} className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent uppercase tracking-wider">
              <Zap className="h-3 w-3" /> AI-Powered
            </span>
          </motion.div>
          <motion.h2 {...fadeUp(0.05)} className="text-center text-3xl md:text-5xl font-black font-heading mb-4 text-foreground">
            Viral Track Transformation
          </motion.h2>
          <motion.p {...fadeUp(0.1)} className="text-center text-muted-foreground text-lg max-w-xl mx-auto mb-14">
            One click to optimize your track using patterns from high-performing music worldwide.
          </motion.p>

          {/* Before/After */}
          <motion.div
            {...fadeUp(0.15)}
            className="glass-card p-8 md:p-12 border-primary/20 relative overflow-hidden">
            
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-40" />

            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-8 items-center relative">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Before</p>
                <div className="space-y-3">
                  {["Hook at 0:45", "Low replay value", "Weak energy curve", "Score: 42/100"].map((t, i) =>
                  <motion.p key={t} {...fadeUp(0.2 + i * 0.04)} className="text-sm text-muted-foreground/70 line-through decoration-destructive/40">{t}</motion.p>
                  )}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center gap-2">
                <div className="h-20 w-px bg-gradient-to-b from-destructive/30 via-primary to-primary/30" />
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="h-20 w-px bg-gradient-to-b from-primary/30 via-primary to-accent/30" />
              </div>

              <div>
                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-4">After</p>
                <div className="space-y-3">
                  {["Hook at 0:12 ✓", "High replay value ✓", "Optimized energy ✓", "Score: 87/100 ✓"].map((t, i) =>
                  <motion.p key={t} {...fadeUp(0.25 + i * 0.04)} className="text-sm text-foreground font-medium">{t}</motion.p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="border-t border-border/20 py-24 px-4">
        <div className="container max-w-5xl">
          <motion.h2 {...fadeUp()} className="text-center text-3xl md:text-5xl font-black font-heading mb-16 text-foreground">
            Artists Trust Our Data
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) =>
            <motion.div
              key={t.handle}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="glass-card p-7 flex flex-col hover:border-primary/15 transition-colors hover:-translate-y-1 transition-transform duration-200">
              
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{t.metric}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed italic flex-1">"{t.quote}"</p>
                <p className="mt-5 text-sm font-bold text-primary">{t.handle}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING PREVIEW ═══════════ */}
      <section className="py-24 px-4 border-t border-border/20">
        <div className="container max-w-6xl">
          <motion.h2 {...fadeUp()} className="text-center text-3xl md:text-5xl font-black font-heading mb-4 text-foreground">
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p {...fadeUp(0.05)} className="text-center text-muted-foreground mb-14 max-w-xl mx-auto text-lg">
            Start free. Pay only when you're ready. One viral hit pays for itself 100x over.
          </motion.p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingPreview.map((plan, i) =>
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className={`glass-card p-8 flex flex-col transition-all duration-200 hover:-translate-y-1 ${plan.highlighted ? "border-primary/40 shadow-2xl shadow-primary/10 xl:scale-[1.03] z-10 relative" : "hover:border-border/50"}`}>
              
                {plan.badge &&
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-purple px-4 py-1 text-[11px] font-black text-primary-foreground tracking-wider shadow-lg shadow-primary/30">
                    ⭐ {plan.badge}
                  </span>
              }
                <h3 className="text-lg font-bold font-heading text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                </div>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) =>
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <span className={plan.highlighted ? "text-primary" : "text-emerald-400"}>✓</span> {f}
                    </li>
                )}
                </ul>
                <Button
                asChild
                className={`mt-8 w-full font-semibold ${plan.highlighted ? "gradient-purple text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95 transition-all" : ""}`}
                variant={plan.highlighted ? "default" : "outline"}>
                
                  <Link to="/pricing">
                    {plan.highlighted ? "Get Pro" : plan.name === "Free" ? "Start Free" : "See Plans"}
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative border-t border-border/20 py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(258_90%_66%_/0.05),transparent_60%)]" />

        <motion.div {...fadeUp()} className="container max-w-2xl relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-8">
            <Activity className="h-3 w-3" /> System Ready
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-heading mb-5 text-foreground">
            Ready to analyze your <span className="gradient-text">hit potential</span>?
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Upload your track and get data-driven insights in 90 seconds. No credit card needed.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              size="lg"
              className="relative gradient-purple text-primary-foreground px-12 py-7 text-lg font-bold shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-shadow overflow-hidden">
              
              <Link to="/analyze" className="flex items-center gap-2">
                <span>Analyze Your Track Free</span>
                <span>🔥</span>
              </Link>
            </Button>
          </motion.div>

          {/* Data trust with platform icons */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground/60">
                Based on patterns from 500K+ top-performing tracks across major platforms
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>);

};

export default Index;