

# Fix Design Inconsistencies Across All Pages

## Issues Identified

1. **Social proof stats mismatch** — Homepage uses "50,000+ Tracks Analyzed", "10,000+ Artists Improved", "+25% Avg Viral Improvement", "67 Countries". Pricing page uses "2,400+ Songs analyzed", "87% Improved their score", "12 Songs went viral" — completely different numbers and style.

2. **Badge style inconsistency** — Homepage uses dark pill with green dot: "Global Music Intelligence Engine — Active". Pricing uses colorful gradient pill with sparkle icon: "Simple pricing · Serious results". Need unified dark pill style.

3. **Hero headline gradient inconsistency** — Homepage uses `gradient-text` (purple-to-purple gradient). Pricing uses `from-purple-400 via-pink-400 to-amber-400` (pink/orange gradient). Standardize to purple brand gradient.

4. **Analyze page styling** — Plain unstyled page with no hero background, no badge, no visual consistency with other pages. Needs the same dark background treatment, badge, and styled hero section.

5. **CTA button inconsistency** — Free plan "Start Free →" is a gray/dark button. Homepage CTA is purple gradient pill. All primary CTAs should use `gradient-purple rounded-full` style.

6. **Pricing ROI banner CTA** — Uses amber/yellow gradient instead of purple. Should match brand.

## Plan

### 1. Pricing page — Fix social proof stats (Pricing.tsx)
Replace the `socialProof` array with the same data as homepage:
- "50,000+" / "Tracks Analyzed"
- "10,000+" / "Artists Improved"  
- "+25%" / "Avg Viral Improvement"

Add a 4th stat to match homepage (or keep 3 — the key is matching numbers). Use animated counters like homepage or at minimum the same labels/values.

### 2. Pricing page — Fix badge to match homepage style (Pricing.tsx)
Replace the colorful gradient badge with the homepage dark pill style:
```
<span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/8 border border-primary/20 text-sm font-semibold text-primary backdrop-blur-sm">
  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
  Simple Pricing — Serious Results
</span>
```

### 3. Pricing page — Fix hero headline gradient (Pricing.tsx)
Change `from-purple-400 via-pink-400 to-amber-400` to the brand `gradient-text` class (purple gradient), matching homepage.

### 4. Analyze page — Add proper hero styling (Analyze.tsx)
- Add a subtle background (ambient gradient like homepage)
- Add the consistent dark pill badge at top
- Better visual hierarchy with the brand styling

### 5. All primary CTAs — Standardize to purple gradient pill (Pricing.tsx, others)
- Free plan CTA: change from gray `bg-white/10` to `gradient-purple text-white rounded-full`
- Pricing ROI banner CTA: change from amber to `gradient-purple text-primary-foreground rounded-full`
- Ensure all "Analyze" CTAs use the same `gradient-purple rounded-full` style

### Files Changed
- `src/pages/Pricing.tsx` — stats, badge, headline gradient, CTA styles
- `src/pages/Analyze.tsx` — hero section styling, badge, background

