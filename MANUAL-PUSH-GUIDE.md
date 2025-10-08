# Manual GitHub Push Instructions

Since GitHub CLI is not installed, follow these manual steps to create the repository and push your code.

## Step 1: Create Repository on GitHub Website

1. **Go to GitHub:**
   - Open: https://github.com/new
   - Or visit: https://github.com/dragonscypher?tab=repositories and click "New"

2. **Fill in Repository Details:**
   ```
   Repository name: Autofile
   Description: AI-Powered Recruitment Assistant - Automate job descriptions, resume screening, ATS scoring, and interview generation
   Visibility: Public
   
   [ ] Initialize this repository with a README (LEAVE UNCHECKED - we have one)
   [ ] Add .gitignore (LEAVE UNCHECKED - we have one)
   [ ] Choose a license (LEAVE UNCHECKED - we have MIT already)
   ```

3. **Click "Create repository"**

## Step 2: Push Your Code

After creating the repository, run these commands in PowerShell:

```powershell
# Add GitHub as remote origin
git remote add origin https://github.com/dragonscypher/Autofile.git

# If remote already exists, update it:
git remote set-url origin https://github.com/dragonscypher/Autofile.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### If Git Asks for Authentication:

**Option A: Use Personal Access Token (Recommended)**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" > "Generate new token (classic)"
3. Give it a name: "Autofile Push"
4. Select scopes: `repo` (full control)
5. Click "Generate token"
6. Copy the token
7. When pushing, use:
   - Username: `dragonscypher`
   - Password: `<paste your token>`

**Option B: Use GitHub Desktop**
1. Download: https://desktop.github.com/
2. Sign in with your GitHub account
3. File > Add Local Repository > Choose S:\Documents\Github\Autofile
4. Publish repository

## Step 3: Verify the Push

After pushing, verify:

1. **Visit your repository:**
   https://github.com/dragonscypher/Autofile

2. **Check that you see:**
   - ✅ All 101 files
   - ✅ README.md displays with badges
   - ✅ 5 commits in history
   - ✅ No .env files (only .env.example)

## Step 4: Set Up Repository

### Add Topics/Tags
1. Go to: https://github.com/dragonscypher/Autofile
2. Click the gear icon next to "About"
3. Add topics:
   ```
   recruitment, ai, nextjs, typescript, ats, 
   resume-screening, interview-generation, 
   ollama, prisma, postgresql
   ```

### Update Repository Description
In the "About" section, add:
```
🤖 AI-Powered Recruitment Assistant - Automate resume screening, ATS scoring, and interview generation
```

Add website (if you deploy):
```
https://autofile.yourdomain.com
```

## Optional: Install GitHub CLI for Future

To make future pushes easier, install GitHub CLI:

```powershell
winget install --id GitHub.cli
```

Then authenticate:
```powershell
gh auth login
```

## Quick Reference Commands

```powershell
# Check remote
git remote -v

# Check branch
git branch

# View commit history
git log --oneline

# Check what's tracked
git ls-files

# Verify no sensitive files
git ls-files | Select-String -Pattern "\.env"
```

## Troubleshooting

### "Remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/dragonscypher/Autofile.git
```

### "Failed to push - permission denied"
- Make sure you're logged into GitHub as `dragonscypher`
- Use a Personal Access Token instead of password
- Or use GitHub Desktop

### "Repository not found"
- Verify you created the repository on GitHub.com
- Check the URL is correct: https://github.com/dragonscypher/Autofile
- Make sure it's under your account, not an organization

## Success Checklist

- [ ] Repository created at https://github.com/dragonscypher/Autofile
- [ ] Code pushed successfully (101 files, 5 commits)
- [ ] README displays correctly with badges
- [ ] No sensitive files visible (.env files excluded)
- [ ] Topics/tags added
- [ ] Repository description set
- [ ] Branch is named `main`

---

**Need Help?**
If you encounter issues, check the GITHUB-PUSH-SUMMARY.md file for more details.
