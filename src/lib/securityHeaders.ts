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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com", // Consider removing 'unsafe-eval'
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
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
