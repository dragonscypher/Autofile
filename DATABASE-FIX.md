# Database Connection Fix

## Problem
The application was failing to create projects with the error:
```
Invalid `prisma.user.upsert()` invocation:
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

## Root Cause
A system-level environment variable `DATABASE_URL=file:./dev.db` was set in the terminal or Windows environment variables. This was overriding the correct PostgreSQL connection string defined in `.env.local` files.

When Next.js loads environment variables, it reads them in this order:
1. **System/User environment variables** (highest priority - this was the problem!)
2. `.env.$(NODE_ENV).local`
3. `.env.local`
4. `.env.$(NODE_ENV)`
5. `.env`

The system environment variable was overriding all our `.env` files.

## Solution
Added a runtime check in `apps/web/lib/db.ts` to detect and fix invalid DATABASE_URL values:

```typescript
// Fix DATABASE_URL if it's set to the wrong value (file:./dev.db)
// This can happen if a system environment variable overrides .env.local
if (!process.env.DATABASE_URL || 
    process.env.DATABASE_URL === 'file:./dev.db' || 
    !process.env.DATABASE_URL.startsWith('postgresql://')) {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/autofile';
}
```

This code:
1. Checks if DATABASE_URL is missing, set to `file:./dev.db`, or doesn't start with `postgresql://`
2. If any condition is true, it sets the correct PostgreSQL connection string
3. Runs before the Prisma Client is instantiated, so the correct URL is used

## How to Permanently Fix
To prevent this issue from recurring, you should clear the system environment variable:

### Option 1: Clear in Current Terminal Session (Temporary)
```powershell
Remove-Item Env:\DATABASE_URL
```

### Option 2: Clear User-Level Environment Variable (Permanent)
```powershell
[System.Environment]::SetEnvironmentVariable('DATABASE_URL', $null, 'User')
```

### Option 3: Clear via Windows Settings (Permanent)
1. Press `Win + X` → System → Advanced system settings
2. Click "Environment Variables"
3. Look for `DATABASE_URL` in both "User variables" and "System variables"
4. Select it and click "Delete"
5. Restart your terminal

## Verification
After the fix, project creation now works:
- ✅ POST /api/projects returns 200 (success)
- ✅ Projects are created in the database
- ✅ Workflow page loads correctly

## Files Modified
1. `apps/web/lib/db.ts` - Added DATABASE_URL validation and override logic
2. `apps/web/.env.local` - Contains correct DATABASE_URL (already was correct)
3. `.env.local` (root) - Contains correct DATABASE_URL (already was correct)

## Testing
Try creating a project:
1. Navigate to http://localhost:3000/projects
2. Click "Create Project"
3. Enter a title and job description
4. Click "Create Project"
5. You should be redirected to the workflow page

If it works, you'll see the 6-step recruitment workflow (JD → Resumes → ATS → Interview → Score → Final).
