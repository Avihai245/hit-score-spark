import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, BarChart3, Rocket, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const TOUR_KEY = 'viralize_tour_seen_v1';

const steps = [
  {
    icon: BarChart3,
    title: "Your Hit Score",
    description: "Every track scores 0–100 based on patterns from 500K+ hits. A score of 80+ signals real viral potential across Spotify, Apple Music & TikTok.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Rocket,
    title: "AI Remix",
    description: "One click to apply proven patterns from today's top performers to your track — production-ready output, no studio required.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Target,
    title: "Competitor DNA Match",
    description: "See exactly which hit songs share your track's sonic DNA and what's separating them from the charts — so you know precisely what to fix.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export const OnboardingTour = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (user && !localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setVisible(true), 1400);
      return () => clearTimeout(t);
    }
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  const current = steps[step];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl shadow-black/60 p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${current.bg} ${current.border} border flex items-center justify-center`}>
                <current.icon className={`h-5 w-5 ${current.color}`} />
              </div>
              <button
                onClick={dismiss}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
                aria-label="Dismiss tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-black text-foreground mb-1.5">{current.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between mt-5">
              {/* Step dots */}
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ width: i === step ? 16 : 6, opacity: i === step ? 1 : 0.35 }}
                    transition={{ duration: 0.2 }}
                    className="h-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {step < steps.length - 1 ? (
                  <>Next <ArrowRight className="h-3.5 w-3.5" /></>
                ) : (
                  <>Got it! <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
