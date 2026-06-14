# Run Movie App Locally

## Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   
   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and update these required values:
   ```env
   # REQUIRED: Get your TMDB API token from https://www.themoviedb.org/settings/api
   NEXT_PUBLIC_TMDB_ACCESS_TOKEN=your_real_tmdb_access_token
   
   # REQUIRED: Supabase project settings (if you want authentication)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OPTIONAL: For admin operations only
   # SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run the app**
   
   **Web version:**
   ```bash
   npm run dev
   ```
   
   **Electron version:**
   ```bash
   npm run electron:dev
   ```

## Verification

Run the verification script to ensure everything is working:
```bash
npm run verify
```

This runs:
- Security guard checks
- TypeScript compilation
- Linting
- Tests

## Development Commands

- `npm run dev` - Start web development server
- `npm run electron:dev` - Build and run Electron app
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run test` - Run unit tests
- `npm run security-guard` - Run security checks

## Environment Variables

### Required for Basic Functionality
- `NEXT_PUBLIC_TMDB_ACCESS_TOKEN` - TMDB API access token

### Required for Authentication
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations only
- `NEXT_PUBLIC_CAPTCHA_SITE_KEY` - Turnstile captcha
- `NEXT_PUBLIC_AVATAR_PROVIDER_URL` - Custom avatar service
- `PROTECTED_PATHS` - Comma-separated list of protected routes

## Troubleshooting

### Blank Player
**Issue:** Video player shows blank screen
**Solutions:**
- Check if TMDB API token is valid and not expired
- Try a different movie/TV show
- Some providers may be temporarily unavailable
- Check browser console for API errors

### Provider Blocked
**Issue:** "This video source is not allowed" message
**Solutions:**
- Ensure the provider URL is in the allowlist (`src/config/allowedPlayerHosts.ts`)
- Check CSP headers in network tab
- Verify the provider domain matches exactly (no subdomain mismatches)

### Supabase Auth Failure
**Issue:** Authentication not working
**Solutions:**
- Verify Supabase URL and anon key are correct
- Check if Supabase project is active
- Ensure email confirmation is enabled in Supabase settings
- Check browser console for auth errors

### TMDB Key Missing/Invalid
**Issue:** No movie data loading
**Solutions:**
- Get a fresh API token from https://www.themoviedb.org/settings/api
- Ensure the token is the "access token" not the "API key"
- Check for typos in the token (no extra spaces)
- Verify token has proper permissions

### Electron Launch Failure
**Issue:** Electron app doesn't start
**Solutions:**
- Run `npm run electron:build` first
- Check if Node.js version is compatible
- Ensure all dependencies are installed
- Try rebuilding: `npm run electron:build && npm run electron:dev`

### Build Errors
**Issue:** TypeScript compilation fails
**Solutions:**
- Check for missing environment variables
- Run `npm install` to ensure all dependencies
- Clear Next.js cache: `rm -rf .next`
- Check for type errors in the codebase

### Test Failures
**Issue:** Tests are failing
**Solutions:**
- Check if environment variables are set for testing
- Some tests may fail without real Supabase credentials
- Run `npm run security-guard` separately to check security
- Focus on build/lint/security checks for basic validation

## Notes

- The app works without authentication for basic movie browsing
- Supabase setup is optional unless you want user accounts
- Electron version includes enhanced security features
- All popup attempts are blocked by default
- Some video providers may show ads or overlays inside the iframe
- Fake buttons inside third-party players cannot be controlled