

# Fix 3 Remaining Issues (Issue 4 already resolved)

## Issue 1 & 2: DnaCard descriptions — Hook Strength too technical + Emotional Impact fragment

**File: `src/pages/Results.tsx`, lines 88–142**

The `getDnaDescription` function needs two fixes:

1. **Hook Strength mid/low tiers**: Add hook lateness calculation (seconds past 0:07) so the sentence reads: *"Your hook is strong, but it arrives at 0:38 — 31 seconds after the window where listeners decide to stay or skip."* Currently it just says "a bit late" without the specific gap.

2. **Emotional Impact**: Remove `emotionalCore` interpolation entirely. All 3 tiers should use fixed full sentences — never pass raw API fragments. High tier becomes: *"The emotional tone of your track connects — this is a real strength for playlist placement and audience targeting."*

## Issue 3: Song Title required on /analyze

**File: `src/pages/Analyze.tsx`**
- Line 706: Remove `(optional)`, add `*` marker: `Song Title <span className="text-red-400">*</span>`
- Line 262-267 (`handleSubmit`): Add title validation before file check:
  ```
  if (!title.trim()) {
    toast({ title: "Song title required", description: "Please enter your song title.", variant: "destructive" });
    return;
  }
  ```

**File: `src/components/FreeTrialUpload.tsx`**
- Line 296: Same label change — remove `(optional)`, add `*`

## Issue 4: Nav items — ALREADY FIXED
`NAV_ITEMS` at line 236 already has exactly 4 items. No changes needed.

## Summary of changes
- `src/pages/Results.tsx`: Rewrite `getDnaDescription` (lines 88-142) — add hookLateness calc, remove emotionalCore interpolation, ensure all descriptions are single clean sentences
- `src/pages/Analyze.tsx`: Label fix (line 706) + validation in handleSubmit (line 262)
- `src/components/FreeTrialUpload.tsx`: Label fix (line 296)

