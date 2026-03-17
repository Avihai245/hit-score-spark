

# Upgrade Dashboard to Suno-Level Quality

Looking at the Suno screenshot, several key differences stand out compared to our current dashboard:

1. **Audio player is always visible** in dashboard (currently only shown outside dashboard routes — line 135 of App.tsx excludes it from dashboard)
2. **Billing page** needs a Suno-style top status bar with plan info, and cleaner plan cards with Monthly/Yearly toggle
3. **Song cards** need album art placeholders, better visual hierarchy, and inline play controls
4. **Overall polish** — the topbar should show plan status info like Suno does (Current Plan, Billing Period, Next Date, Credits)

## Changes

### 1. Show AudioPlayer in Dashboard (`src/App.tsx`)
- Remove the `!isDashboardRoute` condition from `<AudioPlayer />` rendering (line 135)
- This enables music playback across the entire dashboard, like Suno
- Adjust mobile bottom nav padding in DashboardLayout to account for player when active

### 2. Redesign Billing Page — Suno Style (`src/pages/dashboard/Billing.tsx`)
Inspired by the Suno screenshot:
- **Top status strip**: Horizontal bar showing Current Plan, Billing Period, Next Billing Date, Credits Remaining — all in labeled columns, clean and scannable
- **Action buttons top-right**: "Cancel subscription", "Update payment", "Buy more credits"
- **Monthly/Yearly toggle**: Radio-style toggle with "SAVE 20%" badge on yearly
- **Plan cards**: Side-by-side, larger, with colored borders (primary for Pro = "MOST POPULAR", accent for Studio = "BEST VALUE")
- **Feature lists**: Green checkmarks, clear text, more breathing room
- **CTA buttons**: Full-width, bold — "Downgrade" / "Upgrade" / "Change Commitment"

### 3. Improve Dashboard Home Song Cards (`src/pages/dashboard/index.tsx`)
- Larger song cards with gradient album art placeholder (like Suno's colored squares)
- Song title + genre more prominent
- Inline play button overlaid on the album art
- Score badge more visible
- "View Report" and "Improve" as cleaner secondary actions

### 4. Upgrade DashboardTopbar (`src/components/dashboard/DashboardTopbar.tsx`)
- Suno-style: show plan info strip (Current Plan badge, Credits remaining, Next billing date) inline in the topbar
- Keep profile dropdown on the right

### 5. Audio Player Dashboard Awareness (`src/components/dashboard/DashboardLayout.tsx`)
- When audio player is active, add extra bottom padding on mobile so bottom nav + player don't overlap content
- The AudioPlayer component itself already handles fixed bottom positioning

### 6. Bottom nav z-index coordination
- AudioPlayer sits at z-50 fixed bottom — when active on mobile, the bottom nav should shift up or the player should sit above the nav
- Solution: In DashboardLayout, render the mobile bottom nav with `bottom-0` normally, but when a track is playing, add `bottom-[60px]` to push nav above the player. Pass `currentTrack` from AudioPlayerContext.

## Files to Edit
1. `src/App.tsx` — show AudioPlayer in dashboard
2. `src/pages/dashboard/Billing.tsx` — full Suno-style redesign
3. `src/pages/dashboard/index.tsx` — improved song cards with album art
4. `src/components/dashboard/DashboardTopbar.tsx` — plan info strip
5. `src/components/dashboard/DashboardLayout.tsx` — audio player padding coordination

