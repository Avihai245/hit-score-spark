import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Sparkles, Crown, Zap, ArrowRight, Music, TrendingUp, Star, Rocket } from "lucide-react";
import { useState } from "react";

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
    features: [
      "Unlimited analyses",
      "Up to 4 viral songs/month",
      "Smart scan of top 500 live hits",
      "Full viral report + lyrics breakdown",
      "MP3 download",
      "Priority processing",
    ],
    cta: "Get Pro",
    ctaClass: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black shadow-lg shadow-purple-500/25",
    highlighted: true,
    comingSoon: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$29",
    period: "/mo",
    badge: null,
    tagline: "More power",
    description: "More viral songs for serious creators",
    Icon: Star,
    gradient: "from-amber-500/15 to-amber-600/5",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    ring: "ring-amber-500/20",
    features: [
      "Everything in Pro",
      "Up to 10 viral songs/month",
      "WAV + MP3 download",
      "Advanced analytics",
      "Commercial use rights",
      "Priority support",
    ],
    cta: "Get Studio",
    ctaClass: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25",
    highlighted: false,
    comingSoon: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/mo",
    badge: "BEST VALUE",
    tagline: "Scale up",
    description: "Scale your music production",
    Icon: Sparkles,
    gradient: "from-emerald-500/15 to-emerald-600/5",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    ring: "ring-emerald-500/20",
    features: [
      "Everything in Studio",
      "Up to 20 viral songs/month",
      "WAV + MP3 + stems download",
      "Full commercial rights",
      "Early access to new features",
      "Priority support",
    ],
    cta: "Get Business",
    ctaClass: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25",
    highlighted: false,
    comingSoon: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$79",
    period: "/mo",
    badge: null,
    tagline: "No limits",
    description: "No limits. Maximum revenue potential.",
    Icon: Rocket,
    gradient: "from-rose-500/15 to-rose-600/5",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    ring: "ring-rose-500/20",
    features: [
      "Everything in Business",
      "Unlimited viral songs",
      "Fastest priority queue",
      "Full commercial rights",
      "Early access to new features",
      "Premium support",
    ],
    cta: "Go Unlimited",
    ctaClass: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25",
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
    <div className="min-h-screen bg-background px-4 pt-32 pb-20 overflow-hidden">
      <div className="container max-w-7xl">

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
          {plans.map((plan, i) => {
            const { Icon } = plan;
            const isHovered = hoveredPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onHoverStart={() => setHoveredPlan(plan.id)}
                onHoverEnd={() => setHoveredPlan(null)}
                className={`relative flex flex-col rounded-2xl ring-1 ${plan.ring} bg-gradient-to-b ${plan.gradient} backdrop-blur-sm p-5 transition-all duration-300 ${
                  plan.highlighted
                    ? "shadow-2xl shadow-purple-500/15 xl:scale-[1.02] z-10"
                    : ""
                } ${isHovered ? "-translate-y-1" : ""}`}
              >
                {plan.highlighted && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-purple-500/30 via-transparent to-transparent -z-10 blur-sm" />
                )}

                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[10px] font-black tracking-widest shadow-lg shadow-purple-500/30 flex items-center gap-1 whitespace-nowrap">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="space-y-3 pt-1 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-foreground tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm pb-1 font-medium">{plan.period}</span>}
                  </div>
                </div>

                {/* Features — flex-1 pushes CTA to bottom */}
                <div className="space-y-2.5 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <div className={`mt-0.5 rounded-full p-0.5 ${plan.highlighted ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                        <Check className={`h-3 w-3 ${plan.highlighted ? 'text-purple-400' : 'text-green-400'}`} />
                      </div>
                      <span className="text-[13px] text-foreground/80 leading-tight">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA — always aligned at bottom */}
                <div>
                  {plan.comingSoon ? (
                    <div className="space-y-1.5">
                      <button
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-not-allowed ${plan.ctaClass} ${plan.highlighted ? '' : 'opacity-80'}`}
                        disabled
                      >
                        {plan.cta}
                      </button>
                      <p className="text-[11px] text-center text-muted-foreground">Coming soon</p>
                    </div>
                  ) : (
                    <Button asChild className={`w-full py-3 h-auto rounded-xl font-bold text-sm ${plan.ctaClass}`}>
                      <Link to={plan.ctaLink || "/analyze"}>
                        {plan.cta} <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Link>
                    </Button>
                  )}
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
