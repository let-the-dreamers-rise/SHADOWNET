# SHADOWNET Deployment Guide

This guide walks you through deploying SHADOWNET to production using Render (backend) and Vercel (frontend).

## Prerequisites

- GitHub account with SHADOWNET repository
- Render account (free tier available)
- Vercel account (free tier available)
- Gemini API key (or OpenAI API key)

## Step 1: Deploy Backend to Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `let-the-dreamers-rise/SHADOWNET`
4. Render will automatically detect `render.yaml`
5. Set the required environment variables:
   - `LLM_PROVIDER`: `gemini` (or `openai`)
   - `LLM_API_KEY`: Your Gemini API key
   - `FRONTEND_URL`: Leave blank for now (will update after frontend deployment)
6. Click "Apply" to deploy
7. Wait for deployment to complete (5-10 minutes)
8. Copy your backend URL (e.g., `https://shadownet-backend.onrender.com`)

### Option B: Manual Configuration

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `shadownet-backend`
   - Region: Oregon (or closest to you)
   - Branch: `main`
   - Root Directory: Leave blank
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables:
   - `NODE_VERSION`: `18`
   - `LLM_PROVIDER`: `gemini`
   - `LLM_API_KEY`: Your API key
   - `FRONTEND_URL`: Leave blank for now
   - `PORT`: `3000`
   - `LOG_LEVEL`: `info`
6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy your backend URL

### Verify Backend Deployment

Visit `https://your-backend-url.onrender.com/health` - you should see:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-15T..."
}
```

## Step 2: Deploy Frontend to Vercel

### Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `let-the-dreamers-rise/SHADOWNET`
4. Configure project settings:
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)
5. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-url.onrender.com/api`
   - (Replace with your actual Render URL from Step 1)
6. Click "Deploy"
7. Wait for deployment to complete (2-3 minutes)
8. Copy your frontend URL (e.g., `https://shadownet.vercel.app`)

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? shadownet-frontend
# - Directory? ./
# - Override settings? No

# Set environment variable
vercel env add VITE_API_URL
# Enter: https://your-backend-url.onrender.com/api

# Deploy to production
vercel --prod
```

### Verify Frontend Deployment

Visit your Vercel URL - you should see the SHADOWNET dashboard loading.

## Step 3: Update Backend CORS Configuration

Now that you have your frontend URL, update the backend:

1. Go back to Render dashboard
2. Navigate to your `shadownet-backend` service
3. Go to "Environment" tab
4. Update `FRONTEND_URL` environment variable:
   - Value: `https://your-frontend-url.vercel.app`
5. Click "Save Changes"
6. Render will automatically redeploy with the new configuration

## Step 4: Verify Full Application

1. Visit your frontend URL
2. You should see:
   - Agent table populating with 15 agents
   - Activity feed showing transactions
   - Shadow Events feed showing drama
   - Leaderboards updating
   - Stats panel with live data
3. Check browser console for any errors
4. Verify data updates every 3 seconds

## Troubleshooting

### Backend Issues

**Health check failing:**
- Check Render logs for errors
- Verify `LLM_API_KEY` is set correctly
- Ensure `PORT` is set to `3000`

**LLM decisions failing:**
- Check Render logs for API errors
- Verify Gemini API key is valid and has quota
- Check `LLM_PROVIDER` is set to `gemini`

**CORS errors:**
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Include `https://` protocol
- No trailing slash

### Frontend Issues

**Blank page:**
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Ensure backend is running and healthy

**Data not loading:**
- Check Network tab in browser DevTools
- Verify API calls are going to correct backend URL
- Check for CORS errors

**Data not updating:**
- Verify backend simulation is running (check Render logs)
- Check polling interval is working (should see API calls every 3 seconds)

## Monitoring

### Backend Logs (Render)

1. Go to Render dashboard
2. Click on your service
3. Go to "Logs" tab
4. You should see:
   - `SHADOWNET initialized successfully`
   - `Simulation started`
   - `Decision for [Agent]: [action]`
   - `Transaction successful/failed`
   - `Block finalized`

### Frontend Monitoring

Open browser DevTools:
- **Console**: Check for errors
- **Network**: Verify API calls every 3 seconds
- **Application**: Check localStorage/sessionStorage if used

## Updating Deployment

### Backend Updates

Push changes to GitHub main branch - Render will automatically redeploy.

Or manually trigger:
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

### Frontend Updates

Push changes to GitHub main branch - Vercel will automatically redeploy.

Or manually trigger:
```bash
cd frontend
vercel --prod
```

## Cost Considerations

### Free Tier Limits

**Render Free Tier:**
- 750 hours/month (enough for 24/7 operation)
- Spins down after 15 minutes of inactivity
- Cold start takes 30-60 seconds

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- No cold starts

**Gemini API:**
- Free tier: 15 requests/minute
- Sufficient for 15 agents with 5-10 second decision cycles

### Optimization Tips

1. **Reduce agent count** if hitting API limits:
   - Set `AGENT_COUNT=10` in Render environment variables

2. **Increase decision cycle time** to reduce API calls:
   - Set `DECISION_CYCLE_MIN=10000` (10 seconds)
   - Set `DECISION_CYCLE_MAX=15000` (15 seconds)

3. **Keep backend alive** to avoid cold starts:
   - Use a service like UptimeRobot to ping `/health` every 5 minutes

## Production Checklist

- [ ] Backend deployed to Render
- [ ] Backend health check passing
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads without errors
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] LLM integration working
- [ ] Data updates in real-time
- [ ] Shadow features working (drama feed, grudges)
- [ ] Leaderboards updating
- [ ] Activity feed showing transactions
- [ ] Logs showing agent decisions

## Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure API key has sufficient quota
5. Check CORS configuration

## Next Steps

After successful deployment:
1. Share your live URL for demo
2. Monitor logs for any issues
3. Adjust agent count or cycle times if needed
4. Add custom agents or personalities
5. Extend shadow features for more drama!

---

**Congratulations!** Your SHADOWNET is now live and running autonomously in the cloud! 🚀🌑
