import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, BarChart3, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "10M+", label: "Songs Analyzed" },
  { value: "+23", label: "Avg Score Improvement" },
  { value: "40+", label: "Countries" },
];

const steps = [
  { icon: FileText, title: "Paste Lyrics", desc: "Drop your full song lyrics into the analyzer." },
  { icon: BarChart3, title: "Get Your Hit Score", desc: "Our AI rates your song from 0 to 100." },
  { icon: Lightbulb, title: "Know What to Change", desc: "Get specific, actionable feedback instantly." },
];

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold tracking-tight sm:text-7xl"
        >
          Will Your Song Be a{" "}
          <span className="gradient-text">Hit?</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Paste your lyrics. Get a hit score in 30 seconds.
          <br />
          Used by 10,000+ AI music artists.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Button asChild size="lg" className="gradient-purple text-primary-foreground px-8 text-base font-semibold glow-purple hover:opacity-90 transition-opacity">
            <Link to="/analyze">Analyze My Song →</Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap justify-center gap-12"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-accent tabular-nums">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50 py-24">
        <div className="container">
          <h2 className="mb-16 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-purple">
                  <step.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
