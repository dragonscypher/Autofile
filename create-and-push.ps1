#!/usr/bin/env pwsh
# Create GitHub Repository and Push Autofile Project
# Safe Script - No sensitive information will be pushed

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AUTOFILE - GitHub Repository Setup  " -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Repository details
$GITHUB_USERNAME = "dragonscypher"
$REPO_NAME = "Autofile"
$REPO_DESCRIPTION = "AI-Powered Recruitment Assistant - Automate job descriptions, resume screening, ATS scoring, and interview generation"

Write-Host "Repository Details:" -ForegroundColor Yellow
Write-Host "   Owner: $GITHUB_USERNAME" -ForegroundColor White
Write-Host "   Name: $REPO_NAME" -ForegroundColor White
Write-Host "   URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME`n" -ForegroundColor Cyan

# Check if gh CLI is installed
Write-Host "Checking GitHub CLI..." -ForegroundColor Yellow
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "ERROR: GitHub CLI (gh) is not installed!" -ForegroundColor Red
    Write-Host "`nPlease install it:" -ForegroundColor Yellow
    Write-Host "   winget install --id GitHub.cli" -ForegroundColor White
    Write-Host "   OR download from: https://cli.github.com/`n" -ForegroundColor Cyan
    exit 1
}

Write-Host "SUCCESS: GitHub CLI is installed`n" -ForegroundColor Green

# Check authentication
Write-Host "Checking GitHub authentication..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated with GitHub!" -ForegroundColor Red
    Write-Host "`nPlease authenticate:" -ForegroundColor Yellow
    Write-Host "   gh auth login`n" -ForegroundColor White
    
    $response = Read-Host "Do you want to authenticate now? (y/n)"
    if ($response -eq "y") {
        gh auth login
    } else {
        exit 1
    }
}

Write-Host "SUCCESS: Authenticated with GitHub`n" -ForegroundColor Green

# Verify no sensitive files will be pushed
Write-Host "Verifying no sensitive files..." -ForegroundColor Yellow
$sensitivePatterns = @('.env', '*.env', '.env.*', 'dev.db')
$foundSensitive = $false

foreach ($pattern in $sensitivePatterns) {
    $files = git ls-files | Select-String -Pattern $pattern
    if ($files) {
        Write-Host "WARNING: Sensitive files found: $files" -ForegroundColor Red
        $foundSensitive = $true
    }
}

if (-not $foundSensitive) {
    Write-Host "SUCCESS: No sensitive files in git tracking`n" -ForegroundColor Green
} else {
    Write-Host "`nERROR: STOP! Remove sensitive files before pushing!" -ForegroundColor Red
    exit 1
}

# Show what will be pushed
Write-Host "Files to be pushed:" -ForegroundColor Yellow
git ls-files | Select-Object -First 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
$totalFiles = (git ls-files).Count
if ($totalFiles -gt 20) {
    Write-Host "   ... and $($totalFiles - 20) more files" -ForegroundColor Gray
}
Write-Host ""

# Confirm before proceeding
Write-Host "WARNING: This will:" -ForegroundColor Yellow
Write-Host "   1. Create a new PUBLIC repository: $REPO_NAME" -ForegroundColor White
Write-Host "   2. Push all commits to GitHub" -ForegroundColor White
Write-Host "   3. Set up main branch as default`n" -ForegroundColor White

$confirm = Read-Host "Do you want to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "`nAborted by user`n" -ForegroundColor Red
    exit 0
}

# Create the repository
Write-Host "`nCreating GitHub repository..." -ForegroundColor Yellow
gh repo create "$GITHUB_USERNAME/$REPO_NAME" --public --description $REPO_DESCRIPTION --source . --remote origin

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create repository!" -ForegroundColor Red
    Write-Host "   Repository might already exist. Check: https://github.com/$GITHUB_USERNAME/$REPO_NAME`n" -ForegroundColor Yellow
    
    $addRemote = Read-Host "Do you want to add it as remote anyway? (y/n)"
    if ($addRemote -eq "y") {
        git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Remote 'origin' already exists. Updating..." -ForegroundColor Yellow
            git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        }
    } else {
        exit 1
    }
}

# Rename master to main
Write-Host "`nSetting up main branch..." -ForegroundColor Yellow
git branch -M main

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  SUCCESS! Repository Created!  " -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Your project is now on GitHub!" -ForegroundColor Green
    Write-Host "`nRepository URL:" -ForegroundColor Yellow
    Write-Host "   https://github.com/$GITHUB_USERNAME/$REPO_NAME`n" -ForegroundColor Cyan
    
    Write-Host "Repository Stats:" -ForegroundColor Yellow
    Write-Host "   Files pushed: $totalFiles" -ForegroundColor White
    Write-Host "   Commits: $(git rev-list --count HEAD)" -ForegroundColor White
    Write-Host "   Branch: main`n" -ForegroundColor White
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Visit your repo: https://github.com/$GITHUB_USERNAME/$REPO_NAME" -ForegroundColor White
    Write-Host "   2. Add topics/tags for discoverability" -ForegroundColor White
    Write-Host "   3. Enable GitHub Actions (if needed)" -ForegroundColor White
    Write-Host "   4. Add collaborators (Settings > Collaborators)" -ForegroundColor White
    Write-Host "   5. Set up branch protection rules`n" -ForegroundColor White
    
    Write-Host "Security Reminders:" -ForegroundColor Yellow
    Write-Host "   - Never commit .env files" -ForegroundColor Gray
    Write-Host "   - Use GitHub Secrets for sensitive data" -ForegroundColor Gray
    Write-Host "   - Review .gitignore regularly`n" -ForegroundColor Gray
    
    # Open in browser
    $openBrowser = Read-Host "Open repository in browser? (y/n)"
    if ($openBrowser -eq "y") {
        Start-Process "https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    }
    
} else {
    Write-Host "`nERROR: Failed to push to GitHub!" -ForegroundColor Red
    Write-Host "   Check your internet connection and GitHub permissions`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================`n" -ForegroundColor Cyan
