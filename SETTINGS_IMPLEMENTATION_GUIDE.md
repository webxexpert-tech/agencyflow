# Settings Page Implementation Guide

Complete implementation of the AgencyFlow Settings page with production-ready features.

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Supabase Storage Setup](#supabase-storage-setup)
3. [Environment Variables](#environment-variables)
4. [Features Overview](#features-overview)
5. [Validation Rules](#validation-rules)
6. [Password Reset Flow](#password-reset-flow)
7. [Implementation Checklist](#implementation-checklist)
8. [Security Best Practices](#security-best-practices)

---

## Database Setup

### Step 1: Run Database Migration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents from `supabase/migrations/002_settings_profile_extensions.sql`
5. Execute the query

This will add all required columns to the `profiles` table:
- `company_name` - Text field for business name
- `phone` - Phone number with validation
- `website` - Website URL
- `address` - Business address
- `logo_url` - URL to company logo
- `currency` - Default currency (PKR, USD, EUR, GBP, AED)
- `language` - Dashboard language (en, ur, ar)
- `dark_mode` - Boolean for dark mode preference
- `notification_prefs` - JSON object for notification settings
- `first_name` - User first name
- `last_name` - User last name
- `bio` - User bio/title

### Step 2: Verify Database Schema

Run this query to verify all columns were created:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

---

## Supabase Storage Setup

### Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create a new bucket**
3. Name it: `company-logos`
4. **Uncheck** "Make it private" (allow public access for logos)
5. Click **Create Bucket**

### Step 2: Configure Storage Policies

1. Click on the `company-logos` bucket
2. Go to **Policies** tab
3. Click **New Policy** → **For SELECT (Full customization)**

**Policy Configuration:**

**Name:** Allow public read access
```sql
SELECT
```

**Target roles:** anon, authenticated

**Using expression:**
```sql
true
```

4. Click **Review** → **Save policy**

5. Click **New Policy** → **For INSERT (Full customization)**

**Policy Configuration:**

**Name:** Allow users to upload logos
```sql
INSERT
```

**Target roles:** authenticated

**With check expression:**
```sql
auth.uid()::text = (storage.foldername('{{name}}'))[1]
```

6. Click **Review** → **Save policy**

7. Click **New Policy** → **For DELETE (Full customization)**

**Policy Configuration:**

**Name:** Allow users to delete their logos
```sql
DELETE
```

**Target roles:** authenticated

**Using expression:**
```sql
auth.uid()::text = (storage.foldername('{{name}}'))[1]
```

---

## Environment Variables

Ensure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For password reset emails, configure Supabase Auth:
1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Customize the password reset email template
3. Update the redirect URL in the email template to your app's domain

---

## Features Overview

### 1. Company Profile Settings

**Fields:**
- Company Logo (Upload to Supabase Storage)
- Company Name (Required, validated)
- Business Email (Read-only, synced from auth)
- Phone (Validated: 10-15 digits, optional +)
- Website (Validated: must start with http:// or https://)
- Address (Optional)

**Validations:**
```typescript
// Company name: Required, min 2 characters
// Phone: Regex /^\+?[0-9]{10,15}$/
// Website: Regex /^https?:\/\/.+\..+/
```

### 2. Profile Settings

**Fields:**
- First Name
- Last Name
- Email (Read-only, from auth)
- Bio

### 3. Preferences

**Settings:**
- Dark Mode (Switch, persists in DB)
- Currency (Select: PKR, USD, EUR, GBP, AED)
- Language (Select: English, اردو, العربية)

### 4. Notification Settings

**Email Notifications:**
- New expense added
- Monthly report ready
- Team invitations
- Weekly digest
- Monthly summary

**Push Notifications:**
- Expense alerts
- Report generated
- Payment due
- Budget exceeded
- Team activity

### 5. Security Settings

**Features:**
- **Password Reset**: Secure email-based password reset via Supabase
- **Active Sessions**: Display current device/browser information
- **Logout All Devices**: Sign out from all sessions globally
- **Two-Factor Authentication**: Placeholder for future implementation

### 6. Logo Upload

**Features:**
- Upload to Supabase Storage
- Supported formats: JPG, PNG, SVG, WEBP
- Max file size: 5MB
- Automatic previous logo deletion on re-upload
- Public URL retrieval

---

## Validation Rules

### Phone Number Validation

```typescript
// Rule: Only digits and optional leading "+"
// Min: 10 digits
// Max: 15 digits

// Valid examples:
// +1234567890
// 1234567890
// +1 (234) 567-8901 (spaces removed before validation)

// Invalid examples:
// 123456 (too short)
// +1-234-567-890-1234 (too long)
// abc1234567 (contains letters)
```

### Website Validation

```typescript
// Rule: Must start with http:// or https://

// Valid examples:
// https://example.com
// http://www.example.com
// https://api.example.co.uk

// Invalid examples:
// example.com (no protocol)
// ftp://example.com (wrong protocol)
// htp://example.com (typo)
```

### Company Name Validation

```typescript
// Rule: Required, minimum 2 characters

// Valid examples:
// "Acme Inc"
// "My Agency Co."
// "XYZ"

// Invalid examples:
// "" (empty)
// "A" (too short)
```

### Password Strength Validation

```typescript
// Rule: Minimum 8 characters with:
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number

// Valid examples:
// "MyPassword123"
// "SecurePass99"
// "Qwerty12345"

// Invalid examples:
// "password" (no uppercase, no number)
// "PASSWORD123" (no lowercase)
// "Pass1" (too short)
```

---

## Password Reset Flow

### User Initiates Reset

1. User navigates to Settings → Security
2. Clicks "Send Password Reset Link"
3. Validation checks:
   - Email exists in auth
   - Network connectivity
4. Supabase sends reset email to authenticated user's email

### Email Contains

- Reset link with token
- Redirect URL: `https://yourdomain.com/reset-password`
- Expiration: Usually 1 hour

### Reset Password Page

1. User clicks link in email
2. Redirected to `/reset-password` with session token
3. Page validates:
   - Valid Supabase session exists
   - Token hasn't expired
4. User enters new password
5. Password strength validated:
   - Minimum 8 characters
   - At least 1 uppercase
   - At least 1 lowercase
   - At least 1 number
6. Passwords must match
7. Submit updates password via `supabase.auth.updateUser()`
8. Success page shown
9. Auto-redirect to login after 3 seconds

### Security Notes

- Never store password in plain text
- Token expires after 1 hour
- One-time use only
- Supabase handles token validation
- HTTPS enforced for production

---

## Implementation Checklist

### Backend Setup
- [ ] Run database migration (002_settings_profile_extensions.sql)
- [ ] Create Supabase Storage bucket (company-logos)
- [ ] Configure storage policies (READ, INSERT, DELETE)
- [ ] Set environment variables
- [ ] Test database connections

### Frontend Setup
- [ ] Install validation library (zod, used in project)
- [ ] Create `lib/validation.ts` with validation functions
- [ ] Create `lib/storage.ts` with upload utilities
- [ ] Update Settings page component
- [ ] Update Reset Password page

### Features Implementation
- [ ] Company profile with logo upload
- [ ] Form validation with error messages
- [ ] Settings persistence
- [ ] Dark mode toggle with persistence
- [ ] Notification preferences
- [ ] Password reset flow
- [ ] Session management
- [ ] Logout all devices

### Testing
- [ ] Test each validation rule
- [ ] Test logo upload (< 5MB)
- [ ] Test logo deletion
- [ ] Test settings save/load
- [ ] Test password reset email
- [ ] Test password reset flow
- [ ] Test dark mode persistence
- [ ] Test notification preferences
- [ ] Test logout all devices
- [ ] Test page refresh persistence

### Security
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Validate all inputs server-side
- [ ] Enable RLS on profiles table
- [ ] Rate limit password reset
- [ ] Monitor failed login attempts
- [ ] Test XSS protection
- [ ] Test CSRF protection

### Performance
- [ ] Optimize logo image sizes
- [ ] Add loading states
- [ ] Implement debouncing for rapid saves
- [ ] Cache settings on client
- [ ] Test with slow network
- [ ] Monitor bundle size

---

## Security Best Practices

### 1. Authentication

✅ **Do:**
- Always verify `auth.uid()` on backend
- Use Supabase RLS policies
- Implement session validation
- Use secure password reset flow

❌ **Don't:**
- Store passwords in localStorage
- Send passwords in URLs
- Trust client-side validation alone
- Store auth tokens insecurely

### 2. Data Protection

✅ **Do:**
- Encrypt sensitive data in transit (HTTPS)
- Use Row Level Security (RLS)
- Validate all inputs
- Sanitize user data

❌ **Don't:**
- Store plain text passwords
- Expose sensitive data in logs
- Skip input validation
- Allow SQL injection

### 3. File Uploads

✅ **Do:**
- Validate file type and size
- Generate unique filenames
- Delete old files
- Use secure storage URLs

❌ **Don't:**
- Trust user-provided MIME types
- Allow unlimited file size
- Store uploads in code directories
- Use predictable filenames

### 4. Password Reset

✅ **Do:**
- Use email verification
- Implement token expiration
- Require strong passwords
- Log reset attempts

❌ **Don't:**
- Allow password reuse
- Send passwords via email
- Skip strength validation
- Allow unlimited reset attempts

### 5. Session Management

✅ **Do:**
- Implement timeout after inactivity
- Allow logout all devices
- Monitor active sessions
- Use secure cookies

❌ **Don't:**
- Store session IDs in localStorage
- Allow unlimited sessions
- Skip CSRF protection
- Expose session information

---

## Troubleshooting

### Logo Upload Fails

**Check:**
1. Bucket exists: `company-logos`
2. Policies are configured correctly
3. User is authenticated
4. File size < 5MB
5. File format is supported (JPG, PNG, SVG, WEBP)
6. Supabase environment variables are set

**Error: "Bucket not found"**
- Create the bucket in Supabase Storage

**Error: "Permission denied"**
- Check storage policies
- Verify user authentication
- Check bucket permissions

### Password Reset Email Not Received

**Check:**
1. Email is correct in database
2. SMTP is configured in Supabase
3. Email template is active
4. Check spam folder
5. Verify redirect URL

### Settings Not Persisting

**Check:**
1. Database migration was run
2. Columns exist in profiles table
3. RLS policies allow updates
4. User ID matches authenticated user
5. No database constraints violated

### Dark Mode Not Applying

**Check:**
1. Document element has `dark` class
2. CSS is loaded correctly
3. Tailwind dark mode configured
4. Browser cache cleared

---

## File Structure

```
agencyflow/
├── app/
│   ├── dashboard/
│   │   └── settings/
│   │       └── page.tsx          # Main settings page (UPDATED)
│   └── reset-password/
│       └── page.tsx              # Password reset page (UPDATED)
├── lib/
│   ├── validation.ts             # Validation functions (NEW)
│   ├── storage.ts                # Upload utilities (NEW)
│   ├── supabase.ts               # Existing
│   └── utils.ts                  # Existing
├── supabase/
│   └── migrations/
│       ├── 001_dashboard_tables.sql
│       └── 002_settings_profile_extensions.sql  # NEW
└── components/
    └── ui/
        └── [existing components]
```

---

## Deployment Notes

### Before Production:

1. **Database Migration**: Run 002_settings_profile_extensions.sql
2. **Storage Setup**: Create company-logos bucket with policies
3. **Environment Variables**: Set Supabase URL and keys
4. **Email Configuration**: Test password reset emails
5. **HTTPS**: Ensure all URLs use HTTPS
6. **Rate Limiting**: Implement rate limits for password reset
7. **Monitoring**: Set up error tracking (Sentry, etc.)
8. **Backups**: Enable automated database backups

### Production Configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Testing Checklist:

- [ ] All features work in production environment
- [ ] Logo uploads work correctly
- [ ] Password reset emails deliver
- [ ] Settings persist after refresh
- [ ] Dark mode applies correctly
- [ ] Notifications save properly
- [ ] No console errors
- [ ] Load times acceptable

---

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Version History

- **v1.0.0** (2024-01-XX)
  - Initial complete Settings implementation
  - Logo upload functionality
  - Password reset flow
  - Form validation
  - Dark mode persistence
  - Notification preferences
  - Session management

---

**Last Updated:** 2024-01-XX  
**Status:** Production Ready  
**Maintenance:** Active
