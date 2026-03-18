/**
 * Security Headers Configuration
 * Note: These headers should be set by your server/hosting provider
 * This file documents what headers should be configured
 */

export const SECURITY_HEADERS = {
  // Prevents content sniffing attacks
  'X-Content-Type-Options': 'nosniff',

  // Enables browser XSS filtering
  'X-XSS-Protection': '1; mode=block',

  // Clickjacking protection
  'X-Frame-Options': 'SAMEORIGIN',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(','),

  // Content Security Policy (CSP)
  'Content-Security-Policy': [
    "default-src 'self'",
    // script-src: Only self + Stripe for payment processing + Suno for remix
    "script-src 'self' https://js.stripe.com https://api.suno.ai",
    // style-src: Self + Google Fonts (required for design system)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // font-src: Google Fonts
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
    // img-src: Self + data URIs + HTTPS external
    "img-src 'self' data: https:",
    // connect-src: Supabase, Stripe, Suno APIs
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.suno.ai",
    // frame-src: Stripe iframe only
    "frame-src 'self' https://js.stripe.com",
    // Media
    "media-src 'self' https:",
    "object-src 'none'",
    // CSP directives
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join(';'),
};

// Function to set headers (for development/testing)
export const setSecurityHeaders = () => {
  // This would typically be done at the server level
  // Example for Vite dev server in vite.config.ts:
  /*
  server: {
    middlewares: [(req, res, next) => {
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    }],
  }
  */

  if (import.meta.env.DEV) {
    console.log('🔒 Security Headers Configuration:', SECURITY_HEADERS);
  }
};

/**
 * DEPLOYMENT INSTRUCTIONS:
 *
 * Vercel (vercel.json):
 * {
 *   "headers": [
 *     {
 *       "source": "/(.*)",
 *       "headers": [
 *         {
 *           "key": "X-Content-Type-Options",
 *           "value": "nosniff"
 *         },
 *         ...
 *       ]
 *     }
 *   ]
 * }
 *
 * Netlify (netlify.toml):
 * [[headers]]
 * for = "/*"
 * [headers.values]
 * X-Content-Type-Options = "nosniff"
 * X-XSS-Protection = "1; mode=block"
 * ...
 *
 * AWS CloudFront:
 * Use Lambda@Edge to inject headers
 *
 * Nginx:
 * add_header X-Content-Type-Options "nosniff" always;
 * add_header X-XSS-Protection "1; mode=block" always;
 * ...
 */
