import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: ["1 analysis per month", "Basic hit score", "Top-level feedback"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: ["Unlimited analyses", "Full feedback & insights", "Analysis history", "Export reports", "Priority support"],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];

const Pricing = () => {
  const handleProClick = () => {
    // Stripe integration requires Lovable Cloud / Supabase
    // For now, show a message
    window.alert("Stripe checkout will be enabled once Lovable Cloud is set up.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold">Simple Pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you're ready.</p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-8 flex flex-col ${
                plan.highlighted ? "border-accent/40 glow-gold" : ""
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block self-start rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-8 w-full font-semibold ${
                  plan.highlighted
                    ? "gradient-purple text-primary-foreground glow-purple hover:opacity-90 transition-opacity"
                    : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
                onClick={plan.highlighted ? handleProClick : undefined}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
