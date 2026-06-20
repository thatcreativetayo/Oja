# Deploying Oja to Vercel

## Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Vercel CLI installed globally: `npm i -g vercel`

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Navigate to the project directory**
   ```bash
   cd oja
   ```

3. **Deploy to preview**
   ```bash
   vercel
   ```
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **oja** (or your preferred name)
   - In which directory is your code located? **./**
   - Want to modify settings? **N**

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel configuration"
   git push origin main
   ```

2. **Import project to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`
   - Click "Deploy"

### Option 3: One-Click Deploy Button

Add this button to your README.md:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_GITHUB_REPO_URL)
```

## Configuration

The project includes `vercel.json` with:
- **Build Command**: `pnpm run build:web`
- **Output Directory**: `web-build`
- **Install Command**: `pnpm install`
- **Rewrites**: SPA routing configured

## Environment Variables (if needed)

If you have environment variables, add them in:
- **Vercel Dashboard**: Project Settings → Environment Variables
- **CLI**: Use `.env` file or `vercel env` commands

## Custom Domain

After deployment, you can add a custom domain:
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Domains
3. Add your custom domain

## Build Output

The web build will be exported to the `web-build` directory with:
- Optimized production bundle
- Static assets
- Service worker (if configured)

## Troubleshooting

### Build fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Blank page after deployment
- Check browser console for errors
- Verify asset paths in network tab
- Ensure rewrites are working for SPA routing

## Notes

- The mobile frame wrapper only appears on desktop browsers
- Native features (maps, camera) use web fallbacks
- React/React-DOM versions must match (currently 19.1.0)
