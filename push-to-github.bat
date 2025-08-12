@echo off
echo ==========================================
echo PUSHING SAGA AI COACH TO GITHUB
echo ==========================================
echo.
echo STEP 1: Please create a GitHub repository first:
echo   1. Go to https://github.com
echo   2. Click 'New repository'
echo   3. Name: saga-ai-coach
echo   4. Make it Public
echo   5. Don't add README
echo   6. Click 'Create repository'
echo.
set /p repo_url="Enter your GitHub repository URL (e.g., https://github.com/username/saga-ai-coach.git): "
echo.
echo Adding GitHub remote...
git remote add origin %repo_url%
echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main
echo.
echo ==========================================
echo ✅ SUCCESS! Your code is now on GitHub!
echo ==========================================
echo.
echo NEXT STEPS:
echo 1. Set up GitHub Secrets (see DEPLOYMENT_INSTRUCTIONS.md)
echo 2. Deploy to Vercel
echo 3. Configure environment variables
echo.
pause