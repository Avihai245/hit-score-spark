

# Fix: Floating CTA Button Centering on Mobile

## Problem
The floating CTA button on the homepage is not perfectly centered and gets cut off on mobile (390px viewport). The current approach uses `left-1/2 -translate-x-1/2` which can cause sub-pixel issues, and the button content may overflow the viewport width.

## Changes — `src/pages/Index.tsx`

**FloatingCTA component (lines 110-134):**

1. Replace `left-1/2 -translate-x-1/2` positioning with `left-0 right-0 flex justify-center` — this guarantees true centering without transform math and prevents horizontal overflow.

2. Add horizontal padding (`px-4`) to the fixed container so the button never touches screen edges on small devices.

3. Wrap the inner content with `max-w-fit mx-auto` to keep it compact and centered.

4. Increase `bottom` spacing slightly (`bottom-8`) to avoid overlap with any bottom UI elements.

The result: the button will be perfectly centered on all screen sizes with no clipping.

