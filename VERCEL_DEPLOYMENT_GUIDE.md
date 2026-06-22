# 🚀 Vercel Deployment Guide

## Step 1: Get Your Credentials

### Supabase Credentials
1. Go to [supabase.com](https://supabase.com) → Dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Google AI (Gemini) API Key
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy it → `GOOGLE_AI_API_KEY`

---

## Step 2: Add to Vercel Project Settings

1. Go to [vercel.com](https://vercel.com/dashboard) → Select `agencyflow` project
2. Click **Settings** → **Environment Variables**
3. Add these variables (set for Production):

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
GOOGLE_AI_API_KEY = your-gemini-api-key-here
```

**Important**: 
- `NEXT_PUBLIC_*` variables are visible in browser (OK for public keys)
- Service role & API key are private (keep them secret!)
- Set for: **Production**, **Preview**, and **Development**

---

## Step 3: Redeploy to Vercel

After adding env vars, Vercel will automatically redeploy. If not:

```bash
vercel --prod --force
```

Or trigger manual redeploy:
1. Go to [vercel.com/cash-flow-ai/agencyflow](https://vercel.com/cash-flow-ai/agencyflow)
2. Click **Deployments** → Latest → **Redeploy**

---

## Step 4: Verify Deployment

1. Visit your live URL: [agencyflow-mu.vercel.app](https://agencyflow-mu.vercel.app)
2. Log in
3. Go to **AI Proposals** page
4. Should load **without error toasts**

---

## Troubleshooting

### "Failed to load proposals" or "Failed to load scope status"
- **Cause**: Missing Supabase credentials
- **Fix**: Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars

### "GOOGLE_AI_API_KEY not configured"
- **Cause**: Missing Gemini API key
- **Fix**: Add `GOOGLE_AI_API_KEY` to Vercel env vars

### Build still fails
1. Go to Vercel → Settings → Environment Variables
2. **Delete all variables**
3. Re-add them one by one
4. Redeploy

---

## Live URL

**Production**: https://agencyflow-mu.vercel.app

Check deployment status: https://vercel.com/cash-flow-ai/agencyflow
