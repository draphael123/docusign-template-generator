# Deploy to Vercel - Quick Guide

## Prerequisites
- Node.js 18+ installed
- A Vercel account (free at vercel.com)
- Git installed (optional, for GitHub deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Test Locally (Optional)

```bash
npm run dev
```

Visit http://localhost:3000 to verify everything works.

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No**
   - Project name? (Press Enter for default or enter custom name)
   - Directory? (Press Enter for `./`)
   - Override settings? **No**

5. Your app will be deployed and you'll get a URL like: `https://your-project.vercel.app`

### Option B: Deploy via GitHub (Recommended for Continuous Deployment)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click **"Add New..."** → **"Project"**

4. Import your GitHub repository

5. Vercel will auto-detect Next.js settings:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build`
   - Output Directory: `.next`

6. Click **"Deploy"**

7. Your app will be live in 1-2 minutes!

## Step 4: Environment Variables (If Needed)

If you add environment variables later:
1. Go to your project on Vercel dashboard
2. Settings → Environment Variables
3. Add your variables
4. Redeploy

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is 18+
- Check build logs in Vercel dashboard

### Styles Not Loading
- Verify `tailwind.config.js` includes correct content paths
- Check that `app/globals.css` imports Tailwind directives

### PDF Generation Issues
- html2canvas and jsPDF are client-side only, should work on Vercel
- Check browser console for errors

## Post-Deployment

After deployment, you can:
- Set up custom domain in Vercel dashboard
- Enable automatic deployments from GitHub
- Configure preview deployments for pull requests
- Set up analytics and monitoring

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs


