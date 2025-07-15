# Deployment Guide for Patel Chat

This guide covers various deployment options for the Patel Chat application.

## 🚀 Deployment Options

### 1. Static Hosting Services

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Build and deploy
npm run build
vercel --prod
```

#### Netlify
```bash
# Build the project
npm run build

# Deploy via Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# Build the project
npm run build

# Deploy to gh-pages branch
npm i -g gh-pages
gh-pages -d dist
```

### 2. Self-Hosting

#### Apache/Nginx
1. Build the project: `npm run build`
2. Copy `dist/` contents to your web server
3. Configure server to serve `index.html` for all routes

#### Docker
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. CDN Deployment

#### AWS CloudFront + S3
1. Build: `npm run build`
2. Upload `dist/` to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain (optional)

## 🔧 Environment Configuration

### Production Environment Variables
Create `.env.production`:
```env
VITE_API_KEY=your_production_api_key
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### Build Optimization
```json
{
  "scripts": {
    "build": "vite build --mode production",
    "build:analyze": "vite build --mode production && npx vite-bundle-analyzer dist/stats.html"
  }
}
```

## 🔒 Security Considerations

### API Key Protection
- Never commit API keys to version control
- Use environment variables for sensitive data
- Consider implementing API key rotation

### Content Security Policy
Add to your HTML head:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com;">
```

### HTTPS Configuration
Always serve over HTTPS in production:
- Obtain SSL certificate
- Configure server for HTTPS
- Redirect HTTP to HTTPS

## 📊 Performance Optimization

### Build Optimization
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ai: ['@google/generative-ai']
        }
      }
    }
  }
}
```

### Caching Strategy
```nginx
# Nginx configuration
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
}
```

## 🔍 Monitoring & Analytics

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage metrics

### Performance Monitoring
- Web Vitals tracking
- Lighthouse CI integration
- Real User Monitoring (RUM)

## 🚨 Troubleshooting Deployment

### Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

**Runtime Errors:**
- Ensure API keys are properly configured
- Check browser console for JavaScript errors
- Verify all CDN resources are accessible

**Performance Issues:**
- Enable gzip compression
- Optimize images and assets
- Implement proper caching headers

### Health Checks
```javascript
// Add to your app for health monitoring
export const healthCheck = {
  status: 'healthy',
  version: process.env.VITE_APP_VERSION,
  timestamp: new Date().toISOString(),
  services: {
    ai: 'connected',
    storage: 'available',
    voice: 'supported'
  }
};
```

## 📱 PWA Deployment

### Service Worker Registration
Ensure service worker is properly registered:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### App Store Deployment
For mobile app stores:
1. Use Capacitor or Cordova
2. Build native app wrapper
3. Submit to app stores

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Build process completes successfully
- [ ] All tests pass
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Monitoring and analytics set up
- [ ] Backup and recovery plan in place
- [ ] Documentation updated
- [ ] Team notified of deployment

## 🆘 Rollback Procedures

### Quick Rollback
1. Keep previous build artifacts
2. Switch traffic to previous version
3. Investigate and fix issues
4. Redeploy when ready

### Database Considerations
Since this app uses client-side storage:
- No database rollback needed
- User data remains intact
- Consider data migration scripts for major updates

---

For additional support, refer to the main README.md or contact the development team.

