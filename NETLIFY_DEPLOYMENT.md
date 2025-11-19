# Netlify Deployment Guide

This guide covers how to properly configure environment variables for Netlify deployment of the AI Story Maker application.

## ⚠️ Important Security Note

**Recent Fix**: Hardcoded backend URLs have been removed from the source code to prevent secrets from being exposed in the JavaScript bundle. The application now **requires** the following environment variables to be set, or the frontend will fail to connect to the backend.

**❌ Without these environment variables set, the build will succeed but the frontend will not work!**

## Environment Variables Setup

### For Frontend (Netlify Site Settings)

1. **Navigate to Netlify Dashboard**
   - Go to your site dashboard
   - Click on "Site settings" → "Environment variables"

2. **Add Frontend Environment Variables**

Add these environment variables in the Netlify dashboard:

```
VITE_BACKEND_ENDPOINT=https://your-backend-url.onrender.com
VITE_BACKEND_HOST=https://your-backend-url.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

3. **Build Settings**

Ensure your build settings are configured:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18` or higher

### For Backend (Separate Hosting)

Since this is a full-stack application, you'll need to deploy your backend separately:

1. **Backend Hosting Options**:
   - **Render.com** (Recommended)
   - **Heroku**
   - **Railway**
   - **DigitalOcean App Platform**

2. **Backend Environment Variables**

Configure these in your backend hosting provider:

```
MONGODB_URI=mongodb://your-mongodb-connection-string
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_at_least_32_characters
PORT=3001
NODE_ENV=production

# Optional Services
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_API_KEY=your_google_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key_for_advanced_audio
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
```

## Security Best Practices

### ✅ DO:
- Store all secrets in environment variables, never in code
- Use strong, unique passwords and secrets
- Rotate secrets regularly
- Use different secrets for development and production
- Enable Netlify's environment variable protection

### ❌ DON'T:
- Commit `.env` files to version control
- Include actual API keys or secrets in `.env.example`
- Share environment variables through unsecured channels
- Use the same secrets across multiple projects

## Deployment Steps

### 1. Frontend Deployment
```bash
# Build the frontend
npm run build

# Deploy to Netlify (using Netlify CLI)
netlify deploy --prod --dir=dist
```

### 2. Backend Deployment

**For Render.com**:
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard

### 3. Configure Custom Domain (Optional)
- In Netlify: Site settings → Domain management
- Update `VITE_BACKEND_ENDPOINT` to use your custom domain

## Environment Variable Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_BACKEND_ENDPOINT` | Frontend to backend communication | `https://your-backend.onrender.com` |
| `VITE_BACKEND_HOST` | API endpoint for frontend | `https://your-backend.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789-abcdefg.apps.googleusercontent.com` |
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT token signing secret | `your-32-character-random-secret` |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `production` |

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure your backend CORS settings allow your Netlify domain
   - Check that `VITE_BACKEND_ENDPOINT` is correctly configured

2. **Build Failures**
   - Verify all required environment variables are set
   - Check Node.js version compatibility
   - Ensure dependencies are properly installed

3. **Runtime Errors**
   - Check browser console for specific error messages
   - Verify environment variable names match exactly
   - Test backend endpoints independently

### Environment Variable Validation

Add this to your code to validate required environment variables:

```javascript
// In your main application file
const requiredEnvVars = [
  'VITE_BACKEND_ENDPOINT',
  'VITE_BACKEND_HOST',
  'VITE_GOOGLE_CLIENT_ID'
];

requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
});
```

## Security Checklist

- [ ] No secrets committed to version control
- [ ] `.env` files are in `.gitignore`
- [ ] `.env.example` contains only placeholder values
- [ ] Environment variables configured in deployment platform
- [ ] CORS properly configured for production domains
- [ ] HTTPS enabled for all external communications
- [ ] Database connections secured with proper authentication

## Support

If you encounter issues during deployment:
1. Check the Netlify build logs
2. Verify all environment variables are set correctly
3. Test your backend API endpoints independently
4. Review the browser console for client-side errors

## Additional Resources

- [Netlify Environment Variables Documentation](https://docs.netlify.com/site-deploys/create-deploys/#environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Render Deployment Guide](https://render.com/docs)