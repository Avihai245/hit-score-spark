Brand: HitCheck. Dark-only #0a0a0a bg, purple #8B5CF6 (primary), gold #F59E0B (accent).
Fonts: Sora for headings, Plus Jakarta Sans for body. Glass cards with white/5 borders.
Navbar: sticky glass blur, waveform SVG logo, purple-to-gold gradient text, green pulsing "Real AI Analysis" dot.
API: POST to https://hitcheck.vercel.app/api/upload (get-upload-url → S3 PUT → analyze)
Pages: / (hero + features), /analyze (upload + loading waveform), /results (12-section premium report), /pricing
Page transitions: framer-motion AnimatePresence in App.tsx
No Suno references anywhere. Results sections use whileInView for staggered reveal.
