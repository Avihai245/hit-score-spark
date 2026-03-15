import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: [
      "1 analysis per month",
      "Basic hit score",
      "Strengths & improvements",
    ],
    cta: "Get Started",
    ctaLink: "/analyze",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: [
      "Unlimited analyses",
      "Competitor DNA Match",
      "Spotify Algorithm Score",
      "Target Audience Profile",
      "Lyric Analysis & Fix",
      "30-Day Release Roadmap",
      "Playlist Targeting",
      "Priority analysis",
    ],
    cta: "Upgrade Now",
    ctaLink: "/pricing",
    highlighted: true,
  },
];

const faqs = [
  {
    q: "How accurate is the score?",
    a: "Based on 500+ viral hits analysis using GPT-4o Audio. Our scoring model is continuously improved with real-world streaming data.",
  },
  {
    q: "What file formats are supported?",
    a: "MP3 and WAV files, up to 50MB. We recommend MP3 for faster uploads.",
  },
  {
    q: "Is my music safe?",
    a: "Your audio is analyzed then immediately deleted from our servers. We never store, share, or use your music for any other purpose.",
  },
  {
    q: "Can I re-analyze after making changes?",
    a: "Absolutely! Free users get 1 analysis/month. Pro users get unlimited analyses — perfect for iterating on your track.",
  },
];

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5 },
});

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left glass-card p-5 transition-colors hover:border-primary/20"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-sm">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </button>
  );
};

const Pricing = () => {
  const handleProClick = () => {
    window.alert("Stripe checkout will be enabled once Lovable Cloud is set up.");
  };

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="container max-w-4xl">
        <motion.div {...fade(0)} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black">Simple Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">Start free. Upgrade when you're ready to go pro.</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              {...fade(0.1 + i * 0.1)}
              className={`glass-card p-8 flex flex-col ${
                plan.highlighted ? "border-accent/40 glow-gold relative" : ""
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-4 py-1 text-xs font-bold text-accent-foreground">
                  Most Popular
                </span>
              )}
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-lg">{plan.period}</span>}
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground/80">
                    <span className="text-primary text-lg">✓</span> {f}
                  </li>
                ))}
              </ul>
              {plan.highlighted ? (
                <Button
                  onClick={handleProClick}
                  className="mt-8 w-full h-12 gradient-purple text-primary-foreground font-bold glow-purple hover:opacity-90 transition-opacity text-base"
                >
                  {plan.cta}
                </Button>
              ) : (
                <Button asChild variant="outline" className="mt-8 w-full h-12 font-semibold text-base">
                  <Link to={plan.ctaLink}>{plan.cta}</Link>
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div {...fade(0.3)} className="mt-24 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
