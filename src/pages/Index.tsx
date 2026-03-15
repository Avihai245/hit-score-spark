import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

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

const heroStats = [
  { value: 10247, suffix: "+", label: "songs analyzed" },
  { value: 24, prefix: "+", suffix: "", label: "Average improvement", suffixLabel: " points" },
  { value: 67, suffix: "", label: "Used in", suffixLabel: " countries" },
];

const steps = [
  { emoji: "🎵", title: "Upload your MP3/WAV", desc: "Any song, any genre. Drag & drop or click to browse." },
  { emoji: "🧠", title: "AI analyzes everything", desc: "BPM, hook timing, energy, emotion — compared to 500+ viral hits." },
  { emoji: "🚀", title: "Get your Hit Score + roadmap", desc: "Exact score, playlist targets, and the one change that matters." },
];

const features = [
  { emoji: "🎯", title: "Hit Score 0–100", desc: "Know exactly where your song stands against viral benchmarks." },
  { emoji: "🎤", title: "Competitor Match", desc: 'Your song sounds like oskar med k at 73% — discover your lane.' },
  { emoji: "📋", title: "Spotify Playlist Targets", desc: "Know which playlists to submit to, with follower counts and fit scores." },
  { emoji: "📅", title: "30-Day Release Roadmap", desc: "Week-by-week plan tailored to your score and goal." },
  { emoji: "🎵", title: "Hook Analysis", desc: "Is your hook strong enough? We tell you exactly." },
  { emoji: "💡", title: "The One Change", desc: "The single improvement that could 10x your streams." },
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
      {/* Hero - Full viewport height */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center overflow-hidden">
        {/* Subtle purple radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(258_90%_66%_/0.12),transparent_60%)]" />
        
        {/* Purple pill badge */}
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

        {/* H1 - Huge bold white */}
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

        {/* H2 - Muted grey */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative mt-6 text-2xl md:text-3xl font-medium text-muted-foreground"
        >
          Find out before you release it.
        </motion.h2>

        {/* Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative mt-6 max-w-2xl text-lg text-muted-foreground/80 leading-relaxed"
        >
          Upload your track. In 60 seconds, get a professional hit score, lyrics analysis, competitor comparison, and your exact roadmap to viral success.
        </motion.p>

        {/* Two CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="gradient-purple text-primary-foreground px-8 py-6 text-base font-bold glow-purple hover:opacity-90 transition-all hover:scale-105"
          >
            <Link to="/analyze">Analyze My Song Free →</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-8 py-6 text-base font-semibold border-white/20 hover:bg-white/5 hover:border-white/30 transition-all"
          >
            <Link to="/results">See Example Report</Link>
          </Button>
        </motion.div>

        {/* Three animated stat counters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {heroStats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-6">
              {i > 0 && <span className="hidden md:block w-px h-8 bg-white/10" />}
              <div className="text-center">
                <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                  {stat.prefix && <span>{stat.prefix}</span>}
                  <AnimatedCounter from={0} to={stat.value} duration={2.5} />
                  {stat.suffix && <span>{stat.suffix}</span>}
                  {stat.suffixLabel && <span className="text-muted-foreground">{stat.suffixLabel}</span>}
                </span>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
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

      {/* What You Get */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold font-heading mb-4 text-white">
            What You Get
          </motion.h2>
          <motion.p {...fade(0.05)} className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Everything you need to know before you hit release.
          </motion.p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                {...fade(i * 0.08)}
                className="glass-card p-6 hover:border-primary/20 transition-colors"
              >
                <div className="text-2xl mb-3">{f.emoji}</div>
                <h3 className="font-bold font-heading mb-1 text-white">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
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
          <Button
            asChild
            size="lg"
            className="gradient-purple text-primary-foreground px-10 py-6 text-lg font-bold glow-purple hover:opacity-90 transition-opacity"
          >
            <Link to="/analyze">Analyze My Song Free →</Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
