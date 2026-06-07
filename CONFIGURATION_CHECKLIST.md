# Configuration Checklist

## ✅ Pre-Deployment Configuration

Complete these steps in order to activate all Settings features.

---

## 1️⃣ DATABASE CONFIGURATION (Required - 5 min)

### Execute Migration

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy entire contents of `supabase/migrations/002_settings_profile_extensions.sql`
5. Paste into editor
6. Click **Execute** button
7. Wait for success message

### Verify Migration

Run this query to verify all columns were created:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

Expected columns (13 new):
- [ ] company_name (text)
- [ ] phone (text)
- [ ] website (text)
- [ ] address (text)
- [ ] logo_url (text)
- [ ] currency (text)
- [ ] language (text)
- [ ] dark_mode (boolean)
- [ ] notification_prefs (jsonb)
- [ ] first_name (text)
- [ ] last_name (text)
- [ ] bio (text)

---

## 2️⃣ STORAGE CONFIGURATION (Required - 5 min)

### Create Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **Create a new bucket**
3. Name: `company-logos`
4. **Uncheck** "Make it private" (need public access for logos)
5. Click **Create Bucket**

### Add Security Policies

#### Policy 1: Allow Public Read

1. Click `company-logos` bucket
2. Go to **Policies** tab
3. Click **New Policy** → **For SELECT (Full customization)**
4. **Name:** `Allow public read access`
5. **Target roles:** anon, authenticated
6. **Using expression:** `true`
7. Click **Save policy**

#### Policy 2: Allow Authenticated Upload

1. Click **New Policy** → **For INSERT (Full customization)**
2. **Name:** `Allow authenticated users to upload`
3. **Target roles:** authenticated
4. **With check:** `auth.uid()::text = (storage.foldername('{{name}}'))[1]`
5. Click **Save policy**

#### Policy 3: Allow Authenticated Delete

1. Click **New Policy** → **For DELETE (Full customization)**
2. **Name:** `Allow authenticated users to delete`
3. **Target roles:** authenticated
4. **Using:** `auth.uid()::text = (storage.foldername('{{name}}'))[1]`
5. Click **Save policy**

### Verify Bucket

Check bucket details:
- [ ] Bucket name: `company-logos`
- [ ] Public: Yes
- [ ] Policies: 3 (SELECT, INSERT, DELETE)

---

## 3️⃣ EMAIL CONFIGURATION (Required for Password Reset)

### Configure Email Provider

1. Go to Supabase Dashboard → **Authentication**
2. Go to **Email Templates**
3. Click on **Reset Password** template
4. Verify redirect URL is set to:
   ```
   {{ .ConfirmationURL }}
   ```
   Or manually set to:
   ```
   https://yourdomain.com/reset-password
   ```
5. Click **Save**

### Test Email Sending

1. Go to Settings page
2. Click "Send Password Reset Link" button
3. Check email inbox (wait 1-2 min)
4. Verify reset email received

---

## 4️⃣ ENVIRONMENT VARIABLES (Required)

### Verify `.env.local`

Ensure these variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find:**
1. Supabase Dashboard
2. Project Settings
3. API section
4. Copy URL and Anon Key

### For Production

Update in your hosting platform:
- [ ] Vercel: Project Settings → Environment Variables
- [ ] Netlify: Site Settings → Build & Deploy → Environment
- [ ] Other: Set in your CI/CD pipeline

---

## 5️⃣ LOCAL TESTING (5 min)

### Start Development Server

```bash
npm run dev
```

### Navigate to Settings

```
http://localhost:3000/dashboard/settings
```

### Test Each Feature

**Company Tab:**
- [ ] Load existing settings
- [ ] Edit company name
- [ ] Edit phone (try valid: `+1234567890`)
- [ ] Edit phone (try invalid: `123`)
- [ ] Edit website (try valid: `https://example.com`)
- [ ] Edit website (try invalid: `example.com`)
- [ ] Edit address
- [ ] Upload logo (< 5MB)
- [ ] See logo preview
- [ ] Delete logo
- [ ] Click Save
- [ ] See success toast

**Profile Tab:**
- [ ] See first/last name
- [ ] Edit first name
- [ ] Edit last name
- [ ] See read-only email
- [ ] Edit bio
- [ ] Click Save

**Preferences Tab:**
- [ ] Toggle dark mode
- [ ] See immediate effect
- [ ] Change currency
- [ ] Change language
- [ ] Click Save

**Notifications Tab:**
- [ ] Toggle email notifications
- [ ] Toggle push notifications
- [ ] Click Save
- [ ] Reload page
- [ ] Verify all toggles are as you left them

**Security Tab:**
- [ ] See "Send Password Reset Link" button
- [ ] Click button
- [ ] See success toast
- [ ] Check email
- [ ] Click reset link
- [ ] Enter new password
- [ ] See password strength indicator
- [ ] Enter confirm password
- [ ] See validation errors if mismatch
- [ ] Click "Reset Password"
- [ ] See success screen
- [ ] Auto-redirect to login

### Refresh & Logout Test

1. Load settings page
2. Make changes
3. Click Save
4. Refresh page (F5)
5. Verify settings are still there
6. Logout
7. Login again
8. Verify settings persisted

---

## 6️⃣ PRODUCTION DEPLOYMENT (5 min)

### Before Deploying

- [ ] All local tests pass
- [ ] No console errors
- [ ] Database migration executed
- [ ] Storage bucket created and policies set
- [ ] Environment variables ready for production

### Deploy Code

```bash
# Using Vercel (recommended)
git add .
git commit -m "feat: implement complete settings page"
git push origin main

# Vercel auto-deploys, or:
vercel --prod
```

### Verify Production

1. Visit production URL
2. Navigate to `/dashboard/settings`
3. Test logo upload
4. Test password reset
5. Monitor error logs

### Post-Deployment

- [ ] Settings page loads
- [ ] Can upload logo
- [ ] Can save settings
- [ ] Password reset emails arrive
- [ ] Password reset link works
- [ ] No 500 errors
- [ ] Dark mode applies

---

## 🔧 Configuration Reference

### Database Schema Added

```sql
ALTER TABLE profiles ADD COLUMN:
- company_name text
- phone text
- website text
- address text
- logo_url text
- currency text DEFAULT 'PKR'
- language text DEFAULT 'en'
- dark_mode boolean DEFAULT false
- notification_prefs jsonb DEFAULT '{}'
- first_name text
- last_name text
- bio text
```

### Storage Bucket

```
Bucket: company-logos
├─ Public: Yes
├─ Files: logos/{user-id}/{filename}
└─ Policies:
   ├─ SELECT: true (public)
   ├─ INSERT: user_id match
   └─ DELETE: user_id match
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<from Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase>
```

---

## ⚠️ Common Issues & Fixes

### Issue: "Bucket not found"
**Solution:** Create `company-logos` bucket in Supabase Storage

### Issue: "Permission denied" on upload
**Solution:** Add INSERT policy to bucket

### Issue: Settings not saving
**Solution:** 
1. Run database migration
2. Check columns exist
3. Check RLS policies

### Issue: Logo shows 403 error
**Solution:** Add public SELECT policy to bucket

### Issue: Password reset email not received
**Solution:**
1. Check SMTP configured
2. Check email in auth.users
3. Check email template active
4. Wait 1-2 minutes
5. Check spam folder

### Issue: Dark mode not applying
**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check dark_mode column exists
4. Check Tailwind CSS config

---

## 📋 Final Checklist

Before declaring complete:

### Code
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] No warnings

### Database
- [ ] Migration executed
- [ ] 13 columns created
- [ ] Indexes created
- [ ] RLS enabled

### Storage
- [ ] Bucket created
- [ ] 3 policies added
- [ ] Test upload works
- [ ] Public URL works

### Features
- [ ] Settings load correctly
- [ ] All validations work
- [ ] Logo upload works
- [ ] Dark mode works
- [ ] Notifications save
- [ ] Password reset works
- [ ] Logout all works

### Testing
- [ ] Local testing complete
- [ ] No errors
- [ ] All features working
- [ ] Persistence verified

### Production
- [ ] Deployed
- [ ] All features working
- [ ] No production errors
- [ ] Ready for users

---

## 📞 Support

### If Something Doesn't Work

1. **Check** the SETTINGS_IMPLEMENTATION_GUIDE.md
2. **Review** SETTINGS_ARCHITECTURE.md
3. **Look up** issue in Troubleshooting section
4. **Check** Supabase dashboard for errors
5. **Review** browser console (F12)

### Documentation Files

```
SETTINGS_COMPLETE.md                 ← Overview
SETTINGS_IMPLEMENTATION_GUIDE.md     ← Setup & Features
SETTINGS_QUICK_START.md              ← Quick Reference
SETTINGS_ARCHITECTURE.md             ← Technical Deep Dive
```

---

**Status:** Ready for Configuration  
**Estimated Time:** 20 minutes  
**Difficulty:** Easy  
**Support:** Documentation included
