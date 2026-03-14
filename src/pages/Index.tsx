import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const AnimatedScore = () => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, 87, { duration: 2, ease: "easeOut" });
    return ctrl.stop;
  }, [count]);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-40 h-40 rounded-full bg-green-500/10 blur-2xl" />
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r="76" fill="none" stroke="hsl(0 0% 12%)" strokeWidth="8" />
        <motion.circle
          cx="90" cy="90" r="76" fill="none"
          stroke="hsl(142 71% 45%)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 76}
          initial={{ strokeDashoffset: 2 * Math.PI * 76 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 76 * (1 - 0.87) }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.span className="text-5xl font-black text-green-400 tabular-nums">
          {rounded}
        </motion.span>
        <div className="text-xs text-muted-foreground mt-1">/ 100</div>
      </div>
    </div>
  );
};

const stats = [
  { value: "10,000+", label: "Songs analyzed" },
  { value: "+24", label: "Avg score improvement" },
  { value: "60+", label: "Countries" },
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
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-32 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(258_90%_66%/0.08),transparent_70%)]" />
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight"
        >
          Will Your Song
          <br />
          <span className="gradient-text">Go Viral?</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed"
        >
          Upload your song. In 30 seconds, know your hit score,
          who to send it to, and exactly what to change.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mt-8"
        >
          <Button
            asChild
            size="lg"
            className="gradient-purple text-primary-foreground px-10 py-6 text-lg font-bold glow-purple hover:opacity-90 transition-opacity"
          >
            <Link to="/analyze">Analyze My Song Free →</Link>
          </Button>
        </motion.div>

        {/* Animated score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative mt-16"
        >
          <AnimatedScore />
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8"
        >
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              {i > 0 && <span className="hidden md:block text-border">|</span>}
              <div className="text-center">
                <span className="text-xl font-bold text-accent tabular-nums">{s.value}</span>
                <span className="ml-2 text-sm text-muted-foreground">{s.label}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/30 py-24 px-4">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold mb-16">
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
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold mb-4">
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
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/30 py-24 px-4">
        <div className="container max-w-5xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold mb-16">
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
      <section className="py-24 px-4">
        <div className="container max-w-3xl">
          <motion.h2 {...fade(0)} className="text-center text-3xl md:text-4xl font-bold mb-4">
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
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
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
      <section className="border-t border-border/30 py-24 px-4 text-center">
        <motion.div {...fade(0)} className="container max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
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
