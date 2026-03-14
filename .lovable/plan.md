

# HitCheck — AI-Driven Hit Potential Analyzer

## Overview
A dark-themed, professional music analysis tool with 4 pages. Electric purple (#8B5CF6) and gold (#F59E0B) accents on a near-black background (#0a0a0a). Typography: Plus Jakarta Sans. Dense, geometric, studio-grade aesthetic.

## Pages

### 1. Landing Page (/)
- Hero with large headline "Will Your Song Be a Hit?" and subheadline
- Purple gradient CTA button → navigates to /analyze
- 3-stat row (10M+ songs, +23 points, 40+ countries) in gold tabular numbers
- 3-step "How it Works" section with icons

### 2. Analyze Page (/analyze)
- Centered glass card with form: song title, genre dropdown (Melodic House, Indie Pop, R&B, Pop, Hip Hop, Other), optional BPM, large lyrics textarea
- "Analyze Now →" button posts to `https://hitcheck-api.vercel.app/api/analyze`
- Loading state with frequency bar animation
- Privacy note below form
- On success, navigate to /results with response data

### 3. Results Page (/results)
- Large circular SVG score gauge (0-100) with color-coded stroke animation
- Verdict text
- Two-column layout: strengths (✅) and improvements (❌)
- "The One Change That Matters Most" highlighted box
- "Similar Hits to Study" cards
- Copyable Suno Prompt box
- "Analyze Another Song" + Twitter share buttons

### 4. Pricing Page (/pricing)
- Two cards: Free ($0, 1 analysis/month) and Pro ($19/month, unlimited)
- Pro card highlighted with gold border glow
- Full Stripe checkout integration for Pro plan

## Design System
- Dark mode only with CSS variables matching the design brief
- Glass card components with subtle white borders at 0.05 opacity
- Custom animations: score gauge reveal, page transitions, button interactions
- Framer Motion for page transitions and micro-interactions

## Backend Integration
- Real API call to hitcheck-api.vercel.app/api/analyze
- Supabase + Stripe for Pro subscription checkout
- Edge function for Stripe webhook handling

## Navigation
- Minimal top nav with logo, nav links (Analyze, Pricing), across all pages

