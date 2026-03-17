

# Fix Admin Panel Sidebar Overlap + Improve Client Dashboard Clarity

## Problem 1: Admin Panel — Sidebar Covers Content

The AdminNav sidebar is `position: fixed`, but 12 out of 13 admin pages use `flex-1 overflow-auto p-6` on `<main>` without any `margin-left` to offset the sidebar. Only `admin/index.tsx` has `ml-0 md:ml-56`. This causes the sidebar to sit on top of the page content.

**Fix**: Add `ml-0 md:ml-56` to `<main>` in all 12 admin pages:
- `monitoring.tsx`, `analytics.tsx`, `content.tsx`, `users.tsx`, `revenue.tsx`, `tracks.tsx`, `support.tsx`, `system.tsx`, `audit.tsx`, `permissions.tsx`, `lifecycle.tsx`, `notifications.tsx`, `coupons.tsx`

Each page's `<main>` changes from:
```
<main className="flex-1 overflow-auto p-6">
```
to:
```
<main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
```

Also add the mobile hamburger button (like in `admin/index.tsx`) so mobile users can open the nav, and pass `mobileOpen`/`onMobileClose` props to `AdminNav`.

---

## Problem 2: Client Dashboard — Unclear Navigation, Not Intuitive Like Suno

The current dashboard has 4 nav items (Analyze, My Tracks, Make Viral, Billing) but the user feels it's unclear. The dashboard home page is too data-heavy for a music app — it should feel more like Suno where the primary actions are obvious.

**Redesign the Dashboard Home** (`src/pages/dashboard/index.tsx`):

1. **Hero action area at top**: Two large, clear action cards side by side:
   - "Analyze a Song" — prominent CTA with icon, takes to `/analyze`
   - "Make it a Hit" — prominent CTA with icon, takes to `/dashboard/viral`

2. **My Songs section below**: Show recent tracks in a clean grid (like Suno's library), each card showing title, genre, score badge, and quick actions (View Report / Play / Improve).

3. **Remove or minimize**: Stats grid, AI Insight box, usage widget from the main view. Move usage info to a small indicator in the sidebar or topbar.

4. **Sidebar labels**: Make descriptions more action-oriented:
   - "Analyze" → "Analyze Song"
   - "My Tracks" → "My Songs"  
   - "Make Viral" → "Make it a Hit"
   - "Billing" stays

This creates a Suno-like feel: open the app → see your songs → clear CTAs to analyze or improve.

