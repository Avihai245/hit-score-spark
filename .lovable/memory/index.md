Design system: dark-first, purple #8B5CF6 (primary), gold #F59E0B (accent). Plus Jakarta Sans body, Sora headings. Glass cards with border/30.
Global data strip: fixed top bar with platform names + live system indicator, pushes navbar to top-8.
All public pages use pt-28 or pt-32 to account for data strip + navbar.
Microcopy: "data-driven insights", "global benchmarks", "pattern-based analysis" — avoid generic AI language.
Platform mentions: subtle, contextual, never implying official partnerships. Use "based on patterns from top-performing tracks".
Stripe: edge functions for checkout, webhook, portal. Needs STRIPE_WEBHOOK_SECRET secret.
API: real POST to Lambda for upload + analyze. Polling for job completion.
Pages: /, /analyze, /results, /pricing, /billing, /library, /song/:id, /settings, /dashboard/*, /admin/*
