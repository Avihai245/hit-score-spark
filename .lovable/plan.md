

## Analysis

The header system consists of two fixed layers:
- **GlobalDataStrip**: `fixed top-0 z-[60] h-8` (32px)
- **Navbar**: `fixed top-8 z-50 h-14 md:h-16` (56px mobile / 64px desktop)

**Total header height**: 88px mobile, 96px desktop.

### Issues Found

1. **Pages with insufficient top padding**: `Results.tsx` and `Library.tsx` use `pt-24` (96px) — exactly flush on desktop, but clips on mobile where navbar is shorter. Should use `pt-28` minimum for breathing room.

2. **Navbar z-index vs animated elements**: During analysis on `/analyze`, particle effects and scan-line animations could render above the navbar since they may not have proper `z-index` containment.

3. **Results page `StickyNav`** may collide with the main navbar — need to verify its `top` position accounts for both GlobalDataStrip + Navbar.

4. **Dashboard/Admin layouts** have their own sidebar + topbar system and don't show the main Navbar/GlobalDataStrip (verified in `AppContent`), so those should be fine structurally.

---

## Plan

### 1. Fix page top padding across all public pages
Standardize all pages to `pt-28` (112px) minimum to ensure content never gets swallowed by the 88-96px combined header:

- **`Results.tsx`**: `pt-24` → `pt-28`
- **`Library.tsx`**: `pt-24` → `pt-28`
- Other pages already use `pt-28` or `pt-32` — leave as-is.

### 2. Fix Results page StickyNav positioning
The sticky mini-nav in Results must sit below GlobalDataStrip (32px) + Navbar (56/64px). Set its `top` to `top-[88px] md:top-[96px]` and give it `z-30` to stay below the Navbar.

### 3. Enforce z-index hierarchy
Ensure a clear stacking order:
- `z-[60]` — GlobalDataStrip (already correct)
- `z-50` — Navbar (already correct)
- All page-level animated elements (ParticleField, DataStream, ScanLine, processing animations) must be capped at `z-10` or lower and contained within their sections via `overflow-hidden` or `position: relative` parents.

### 4. Fix Analyze page processing screen containment
The processing screen in `Analyze.tsx` uses `ParticleField` and `DataStream` components. Verify these have `pointer-events-none` and `z-0`/`z-10` to prevent overlap with the fixed header. Add `overflow-hidden` to the processing container if needed.

### 5. Audit mobile layout for all pages
- Verify Navbar mobile menu doesn't get cut off by GlobalDataStrip
- Ensure floating CTAs on Results and Index don't overlap with bottom content
- Dashboard sidebar drawer overlay uses `z-40` (below Navbar `z-50`) — correct

