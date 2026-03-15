import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Sparkles, Crown, Zap, Building2, ArrowRight } from "lucide-react";
import { useState } from "react";

// Inline Coins icon since lucide might not export it in this version
function Coins({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6"/>
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
      <path d="M7 6h1v4"/>
      <path d="m16.71 13.88.7.71-2.82 2.82"/>
    </svg>
  );
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    badge: null,
    description: "Try it out, no credit card needed",
    Icon: Zap,
    iconColor: "#6b7280",
    borderColor: "border-white/10",
    features: [
      "1 analysis per month",
      "Basic hit score (0–100)",
      "3 improvement suggestions",
      "Strengths & weaknesses",
      "Share your score",
    ],
    missing: ["AI Remix", "PDF Report", "Unlimited analyses", "Playlist targeting"],
    cta: "Get Started Free",
    ctaLink: "/analyze",
    ctaStyle: "border border-white/20 bg-white/5 hover:bg-white/10 text-white",
    highlighted: false,
    comingSoon: false,
  },
  {
    id: "payg",
    name: "Pay As You Go",
    price: "No subscription",
    period: "",
    badge: null,
    description: "Pay only for what you use",
    Icon: Coins,
    iconColor: "#3B82F6",
    borderColor: "border-blue-500/20",
    features: [
      "Analysis — $3 each",
      "AI Remix — $7 each",
      "Full analysis report",
      "AI Remix with your style",
      "Download MP3",
      "No monthly commitment",
    ],
    missing: ["PDF Report", "Priority processing"],
    cta: "Buy Credits",
    ctaStyle: "border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400",
    highlighted: false,
    comingSoon: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    badge: "MOST POPULAR",
    description: "For serious artists going viral",
    Icon: Crown,
    iconColor: "#8B5CF6",
    borderColor: "border-purple-500/40",
    features: [
      "Unlimited analyses",
      "10 AI Remixes per month",
      "Full deep analysis",
      "PDF download reports",
      "Priority analysis queue",
      "Competitor DNA match",
      "Playlist targeting",
      "30-day release roadmap",
    ],
    missing: [],
    cta: "Start Pro",
    ctaStyle: "bg-purple-600 hover:bg-purple-500 text-white font-black",
    highlighted: true,
    comingSoon: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$49",
    period: "/month",
    badge: null,
    description: "For labels, studios & teams",
    Icon: Building2,
    iconColor: "#F59E0B",
    borderColor: "border-amber-500/20",
    features: [
      "Everything in Pro",
      "Unlimited AI Remixes",
      "API access",
      "White-label reports",
      "3 team seats",
      "Dedicated support",
      "Custom integrations",
    ],
    missing: [],
    cta: "Contact Sales",
    ctaStyle: "border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400",
    highlighted: false,
    comingSoon: true,
  },
];

const Pricing = () => {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-24 pb-20">
      <div className="container max-w-6xl">

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            Turn your song into a{" "}
            <span className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
              viral hit
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free. Pay only when you're ready. Scale as you grow.
          </p>
        </motion.div>

        {/* ─── Plans Grid ─── */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {plans.map((plan, i) => {
            const { Icon } = plan;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onHoverStart={() => setHoveredPlan(plan.id)}
                onHoverEnd={() => setHoveredPlan(null)}
                className={`relative rounded-3xl border ${plan.borderColor} p-6 space-y-6 transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-purple-500/10 to-transparent shadow-2xl shadow-purple-500/10 scale-[1.02]"
                    : "bg-white/[0.02] hover:bg-white/[0.04]"
                } ${hoveredPlan === plan.id ? "translate-y-[-4px]" : ""}`}
              >
                {/* Top accent line */}
                {plan.highlighted && (
                  <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-purple-600 text-white text-xs font-black tracking-wider shadow-lg shadow-purple-500/30">
                      ⭐ {plan.badge}
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="space-y-3 pt-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${plan.iconColor}20` }}>
                    <Icon className="h-5 w-5" style={{ color: plan.iconColor }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div>
                  {plan.id === "payg" ? (
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-blue-400">No subscription</div>
                      <div className="text-sm text-muted-foreground">Analysis: <span className="text-white font-bold">$3</span></div>
                      <div className="text-sm text-muted-foreground">AI Remix: <span className="text-white font-bold">$7</span></div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground text-sm pb-1">{plan.period}</span>}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div>
                  {plan.comingSoon ? (
                    <div className="space-y-2">
                      <button
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all opacity-70 cursor-not-allowed ${plan.ctaStyle}`}
                        disabled
                      >
                        {plan.cta}
                      </button>
                      <p className="text-xs text-center text-muted-foreground">Coming soon</p>
                    </div>
                  ) : (
                    <Button asChild className={`w-full py-3 rounded-xl font-bold text-sm ${plan.ctaStyle}`}>
                      <Link to={plan.ctaLink || "/analyze"}>
                        {plan.cta} <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{f}</span>
                    </div>
                  ))}
                  {plan.missing?.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 opacity-40">
                      <span className="h-4 w-4 flex-shrink-0 mt-0.5 text-center text-xs">—</span>
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Conversion Banner ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 p-8 md:p-12 text-center space-y-6"
        >
          <div className="text-5xl">🔥</div>
          <h2 className="text-2xl md:text-4xl font-black text-white">
            Your song scored <span className="text-amber-400">[X]/100</span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            You're <span className="text-white font-bold">[100-X] points</span> from going viral.
            Create your AI Remix now and fix it in 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-lg opacity-70 cursor-not-allowed">
              Create AI Remix — $7 (Coming Soon)
            </button>
            <button className="px-8 py-4 rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-300 font-bold text-lg opacity-70 cursor-not-allowed">
              Go Pro — $19/month · 10x value (Coming Soon)
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Analyze your song first →{" "}
            <Link to="/analyze" className="text-primary hover:underline">
              Start free analysis →
            </Link>
          </p>
        </motion.div>

        {/* ─── Footer note ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-center space-y-4"
        >
          <h3 className="text-xl font-bold text-white">Questions?</h3>
          <p className="text-muted-foreground">
            Every plan starts with a free analysis. No credit card required.{" "}
            <Link to="/analyze" className="text-primary hover:underline font-medium">
              Try it now →
            </Link>
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default Pricing;
