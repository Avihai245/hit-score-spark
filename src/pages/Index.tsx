import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Headphones, BarChart3, Target, Users, FileText, CalendarDays, Flame } from "lucide-react";

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
  const [count, setCount] = useState(10247);
  useEffect(() => {
    const interval = setInterval(() => setCount(c => c + 1), 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
    >
      <motion.div
        className="w-2 h-2 rounded-full bg-green-400"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      <span className="text-sm font-semibold text-white tabular-nums">
        {count.toLocaleString()}
      </span>
      <span className="text-sm text-muted-foreground">songs analyzed</span>
    </motion.div>
  );
};

const statCards = [
  { emoji: "🎵", label: "Avg score improvement", value: "+24 pts", color: "from-primary/10 to-primary/5 border-primary/20" },
  { emoji: "⚡", label: "Analysis time", value: "~20s", color: "from-accent/10 to-accent/5 border-accent/20" },
  { emoji: "🌍", label: "Used in", value: "67 countries", color: "from-green-500/10 to-green-500/5 border-green-500/20" },
];

const steps = [
  { emoji: "🎵", title: "Upload your MP3/WAV", desc: "Any song, any genre. Drag & drop or click to browse." },
  { emoji: "🧠", title: "AI analyzes everything", desc: "BPM, hook timing, energy, emotion — compared to 500+ viral hits." },
  { emoji: "🚀", title: "Get your Hit Score + roadmap", desc: "Exact score, playlist targets, and the one change that matters." },
];

const viralFeatures = [
  { icon: Headphones, color: "text-primary", title: "Real Audio Listening", desc: "GPT-4o actually listens to your song and hears BPM, hook timing, and emotional energy." },
  { icon: BarChart3, color: "text-accent", title: "Spotify Algorithm Score", desc: "We predict your save rate, skip risk, valence and danceability against Spotify's exact signals." },
  { icon: Target, color: "text-primary", title: "Competitor DNA Match", desc: "See which viral hits your song sounds like and exactly what they have that you're missing." },
  { icon: Users, color: "text-accent", title: "Target Audience Profile", desc: "Know who will listen, when, and what TikTok content matches your sound." },
  { icon: FileText, color: "text-primary", title: "Lyric Analysis & Fix", desc: "Get your weakest lyric identified with a specific suggested replacement." },
  { icon: CalendarDays, color: "text-accent", title: "30-Day Release Roadmap", desc: "A week-by-week action plan based on your score, goal, and genre — ready to execute." },
];

const testimonials = [
  {
    quote: "I was about to release a 58/100 song. HitCheck showed me one fix. Rereleased at 84. Now at 2M streams.",
    handle: "@axelbeats",
  },
  {
    quote: "The competitor match blew my mind. I never knew my song was that close to a Dennis Lloyd vibe.",
    handle: "@lunawave",
  },
  {
    quote: "Saved me $300 in SubmitHub submissions by knowing exactly who to target.",
    handle: "@sonicpilot",
  },
];

const pricingPreview = [
  {
    name: "Free",
    price: "$0",
    features: ["1 analysis / month", "Basic hit score", "Strengths & improvements"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    features: ["Unlimited analyses", "Competitor Match", "30-Day Roadmap", "Playlist Targeting", "Priority analysis"],
    highlighted: true,
  },
];

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.6 },
});

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(258_90%_66%_/0.12),transparent_60%)]" />

        {/* Live counter */}
        <div className="relative mb-6">
          <LiveCounter />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
            <span>🎯</span>
            <span>Powered by GPT-4o Audio — Real Song Analysis</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold font-heading tracking-tight text-white leading-[1.1]"
        >
          Will Your Song
          <br />
          Go Viral?
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative mt-6 text-2xl md:text-3xl font-medium text-muted-foreground"
        >
          Find out before you release it.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative mt-6 max-w-2xl text-lg text-muted-foreground/80 leading-relaxed"
        >
          Upload your track. In 60 seconds, get a professional hit score, lyrics analysis, competitor comparison, and your exact roadmap to viral success.
        </motion.p>

        {/* CTA with fire animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              size="lg"
              className="relative gradient-purple text-primary-foreground px-8 py-6 text-base font-bold glow-purple hover:opacity-90 transition-all overflow-hidden"
            >
              <Link to="/analyze" className="flex items-center gap-2">
                Analyze My Song
                <motion.span
                  animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  🔥
                </motion.span>
              </Link>
            </Button>
          </motion.div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-8 py-6 text-base font-semibold border-white/20 hover:bg-white/5 hover:border-white/30 transition-all"
          >
            <Link to="/results">See Example Report</Link>
          </Button>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full"
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className={`rounded-xl bg-gradient-to-b ${stat.color} border p-4 text-center backdrop-blur-sm`}
            >
              <span className="text-2xl">{stat.emoji}</span>
              <p className="text-lg font-black text-white mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/5 py-24 px-4 bg-[#0a0a0a]">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold font-heading mb-16 text-white">
            How It Works
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                {...fade(i * 0.1)}
                className="glass-card p-8 text-center hover:border-primary/20 transition-colors"
              >
                <div className="text-4xl mb-4">{step.emoji}</div>
                <h3 className="text-lg font-bold font-heading mb-2 text-white">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything You Need */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold font-heading mb-4 text-white">
            Everything You Need to Go Viral
          </motion.h2>
          <motion.p {...fade(0.05)} className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Six powerful analysis tools working together to maximize your streams.
          </motion.p>
          <div className="grid gap-6 sm:grid-cols-2">
            {viralFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                {...fade(i * 0.08)}
                className="glass-card p-6 hover:border-primary/20 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <f.icon className={`h-8 w-8 ${f.color} mb-4 transition-transform group-hover:scale-110`} />
                <h3 className="font-bold font-heading mb-2 text-white text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-white/5 py-24 px-4 bg-[#0a0a0a]">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold font-heading mb-16 text-white">
            Artists Love HitCheck
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.handle}
                {...fade(i * 0.1)}
                className="glass-card p-6"
              >
                <p className="text-sm text-foreground/80 leading-relaxed italic">"{t.quote}"</p>
                <p className="mt-4 text-sm font-semibold text-primary">{t.handle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="container max-w-3xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold font-heading mb-4 text-white">
            Simple Pricing
          </motion.h2>
          <motion.p {...fade(0.05)} className="text-center text-muted-foreground mb-12">
            Start free. Upgrade when you're ready.
          </motion.p>
          <div className="grid gap-6 md:grid-cols-2">
            {pricingPreview.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...fade(i * 0.1)}
                className={`glass-card p-8 flex flex-col ${
                  plan.highlighted ? "border-accent/40 glow-gold" : ""
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-3 inline-block self-start rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold font-heading text-white">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`mt-8 w-full font-semibold ${
                    plan.highlighted
                      ? "gradient-purple text-primary-foreground glow-purple hover:opacity-90 transition-opacity"
                      : ""
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link to={plan.highlighted ? "/pricing" : "/analyze"}>
                    {plan.highlighted ? "Upgrade to Pro" : "Get Started"}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/5 py-24 px-4 text-center bg-[#0a0a0a]">
        <motion.div {...fade(0)} className="container max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black font-heading mb-4 text-white">
            Ready to know your <span className="gradient-text">hit score</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Upload your song and get your analysis in 30 seconds. No credit card needed.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              size="lg"
              className="gradient-purple text-primary-foreground px-10 py-6 text-lg font-bold glow-purple hover:opacity-90 transition-opacity"
            >
              <Link to="/analyze" className="flex items-center gap-2">
                Analyze My Song Free
                <motion.span
                  animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  🔥
                </motion.span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
