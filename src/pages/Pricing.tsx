import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Sparkles, Crown, Zap, Building2, ArrowRight, Music, TrendingUp, Star } from "lucide-react";
import { useState } from "react";

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
    tagline: "Try it out",
    description: "See if your song has viral potential — zero risk",
    Icon: Zap,
    gradient: "from-gray-500/20 to-gray-600/5",
    iconBg: "bg-gray-500/15",
    iconColor: "text-gray-400",
    ring: "ring-white/10",
    features: [
      "1 analysis per month",
      "Hit score (0–100)",
      "3 improvement tips",
      "Strengths & weaknesses",
      "Share your score",
    ],
    cta: "Start Free",
    ctaLink: "/analyze",
    ctaClass: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
    highlighted: false,
    comingSoon: false,
  },
  {
    id: "payg",
    name: "Pay As You Go",
    price: null,
    period: "",
    badge: null,
    tagline: "No commitment",
    description: "Perfect for artists releasing singles",
    Icon: Coins,
    gradient: "from-blue-500/15 to-blue-600/5",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    ring: "ring-blue-500/20",
    priceLines: [
      { label: "Deep Analysis", price: "$2.99", note: "per song" },
      { label: "AI Remix", price: "$6.99", note: "per remix" },
    ],
    features: [
      "Full analysis report",
      "AI Remix with your style",
      "Download MP3 & WAV",
      "Viral potential breakdown",
      "No expiration on credits",
    ],
    cta: "Buy Credits",
    ctaClass: "bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/25",
    highlighted: false,
    comingSoon: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/mo",
    badge: "MOST POPULAR",
    tagline: "Best value",
    description: "For artists serious about going viral",
    Icon: Crown,
    gradient: "from-purple-500/20 via-purple-600/10 to-purple-500/5",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    ring: "ring-purple-500/40",
    savings: "Save $40+/mo vs Pay As You Go",
    features: [
      "Unlimited analyses",
      "10 AI Remixes per month",
      "Deep viral breakdown",
      "PDF download reports",
      "Priority processing",
      "Competitor DNA match",
      "Playlist targeting tips",
      "30-day release roadmap",
    ],
    cta: "Get Pro",
    ctaClass: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black shadow-lg shadow-purple-500/25",
    highlighted: true,
    comingSoon: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$49",
    period: "/mo",
    badge: null,
    tagline: "For teams",
    description: "Labels, studios & management teams",
    Icon: Building2,
    gradient: "from-amber-500/15 to-amber-600/5",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    ring: "ring-amber-500/20",
    features: [
      "Everything in Pro",
      "Unlimited AI Remixes",
      "API access",
      "White-label reports",
      "3 team seats",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    ctaClass: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25",
    highlighted: false,
    comingSoon: true,
  },
];

const socialProof = [
  { stat: "2,400+", label: "Songs analyzed" },
  { stat: "87%", label: "Improved their score" },
  { stat: "12", label: "Songs went viral" },
];

const Pricing = () => {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-20 overflow-hidden">
      <div className="container max-w-7xl">

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 space-y-5"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/15 to-amber-500/15 border border-purple-500/20 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-purple-300">Simple pricing</span>
            <span className="text-white/40">·</span>
            <span className="text-amber-300">Serious results</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            <span className="text-foreground">Invest in your music.</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              Get viral returns.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One hit song can change your career forever. Our AI finds exactly what's 
            missing — so every release has maximum viral potential.
          </p>
        </motion.div>

        {/* ─── Social Proof ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-8 md:gap-14 mb-16"
        >
          {socialProof.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-foreground">{item.stat}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ─── Plans Grid ─── */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          {plans.map((plan, i) => {
            const { Icon } = plan;
            const isHovered = hoveredPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onHoverStart={() => setHoveredPlan(plan.id)}
                onHoverEnd={() => setHoveredPlan(null)}
                className={`relative flex flex-col rounded-2xl ring-1 ${plan.ring} bg-gradient-to-b ${plan.gradient} backdrop-blur-sm p-7 transition-all duration-300 ${
                  plan.highlighted
                    ? "shadow-2xl shadow-purple-500/15 xl:scale-[1.03] z-10"
                    : ""
                } ${isHovered ? "-translate-y-1" : ""}`}
              >
                {/* Glow effect for highlighted */}
                {plan.highlighted && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-purple-500/30 via-transparent to-transparent -z-10 blur-sm" />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[11px] font-black tracking-widest shadow-lg shadow-purple-500/30 flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="space-y-4 pt-1 mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6 min-h-[60px]">
                  {plan.id === "payg" && plan.priceLines ? (
                    <div className="space-y-2">
                      {plan.priceLines.map((line) => (
                        <div key={line.label} className="flex items-baseline justify-between">
                          <span className="text-sm text-muted-foreground">{line.label}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-foreground">{line.price}</span>
                            <span className="text-xs text-muted-foreground">{line.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-black text-foreground tracking-tight">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground text-base pb-1.5 font-medium">{plan.period}</span>}
                    </div>
                  )}
                  {plan.savings && (
                    <p className="text-xs text-green-400 font-semibold mt-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {plan.savings}
                    </p>
                  )}
                </div>

                {/* CTA */}
                <div className="mb-6">
                  {plan.comingSoon ? (
                    <div className="space-y-1.5">
                      <button
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-not-allowed ${plan.ctaClass} ${plan.highlighted ? '' : 'opacity-80'}`}
                        disabled
                      >
                        {plan.cta}
                      </button>
                      <p className="text-[11px] text-center text-muted-foreground">Coming soon</p>
                    </div>
                  ) : (
                    <Button asChild className={`w-full py-3.5 h-auto rounded-xl font-bold text-sm ${plan.ctaClass}`}>
                      <Link to={plan.ctaLink || "/analyze"}>
                        {plan.cta} <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.06] mb-5" />

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <div className={`mt-0.5 rounded-full p-0.5 ${plan.highlighted ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                        <Check className={`h-3 w-3 ${plan.highlighted ? 'text-purple-400' : 'text-green-400'}`} />
                      </div>
                      <span className="text-sm text-foreground/80 leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── ROI Banner ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/10 to-amber-500/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
          <div className="relative ring-1 ring-white/10 rounded-2xl p-10 md:p-14 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/20">
              <Music className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">The math is simple</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
              One viral song = <span className="text-amber-400">$10,000+</span> in streams
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A single viral hit can generate thousands in streaming revenue, sync deals, and fan growth. 
              Our AI tells you exactly what to fix — for less than a coffee.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button asChild className="px-8 py-4 h-auto rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/20">
                <Link to="/analyze">
                  Analyze Your Song Free <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required · Results in 30 seconds
            </p>
          </div>
        </motion.div>

        {/* ─── Footer ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center space-y-3"
        >
          <h3 className="text-lg font-bold text-foreground">Still not sure?</h3>
          <p className="text-muted-foreground">
            Start with a free analysis — no signup needed.{" "}
            <Link to="/analyze" className="text-primary hover:underline font-semibold">
              Try it now →
            </Link>
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default Pricing;
