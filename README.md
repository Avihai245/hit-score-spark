# Hit Score Spark - Music Analysis & Remix Platform

A modern music analysis and AI-powered remix platform with user authentication, billing, and an admin dashboard.

## Project info

**Type**: Web Application (React + Supabase + Stripe)
**Status**: Development
**License**: MIT

## How to get started

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project uses:
- **Frontend**: Vercel or Netlify
- **Backend**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe

### Environment Variables Required

Create `.env.local` with:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_STRIPE_PUBLISHABLE_KEY=your_key
VITE_LAMBDA_URL=your_lambda_url
VITE_SUNO_API=your_suno_url
```

### Deploy to Vercel

```bash
npm run build
# Push to GitHub, connect to Vercel
```

### Deploy to Netlify

```bash
npm run build
# Connect dist folder to Netlify
```

## Security

⚠️ **Before Production**:
- [ ] Rotate all API keys
- [ ] Enable Supabase RLS policies
- [ ] Configure CORS
- [ ] Set up audit logging
- [ ] Implement rate limiting

See `SECURITY_AUDIT_REPORT.md` for full security checklist.
