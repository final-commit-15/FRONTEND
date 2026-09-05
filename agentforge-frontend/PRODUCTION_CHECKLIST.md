# AgentForge Frontend - Production Deployment Checklist

## ✅ Pre-Deployment Validation

### Code Quality
- [ ] `npm run lint` - Zero errors (warnings acceptable)
- [ ] `npx tsc --noEmit` - Zero TypeScript errors
- [ ] `npm run test` - All tests pass
- [ ] `npm audit --audit-level=high` - Zero high/critical vulnerabilities

### Build Verification
- [ ] `npm run build` - Successful production build
- [ ] Build output in `dist/` directory
- [ ] Service worker files generated (`sw.js`, `workbox-*.js`)
- [ ] Manifest.json copied to `dist/`
- [ ] All assets have content hashes in filenames

### Environment Configuration
- [ ] `.env.example` updated with all required variables
- [ ] Vercel Production environment variables set:
  - [ ] `VITE_API_URL` - Production API endpoint
  - [ ] `VITE_APP_NAME` - "AgentForge"
  - [ ] `VITE_APP_VERSION` - Current version
  - [ ] `VITE_NODE_ENV` - "production"
  - [ ] `VITE_ENABLE_PWA` - "true"
- [ ] Vercel Preview environment variables set (staging values)
- [ ] GitHub Actions secrets configured:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`

---

## ✅ Vercel Configuration

### Project Settings
- [ ] Project linked to `final-commit-15/FRONTEND` repository
- [ ] Production branch: `main`
- [ ] Auto-deploy enabled for production branch
- [ ] Preview deployments enabled for all branches
- [ ] PR deployments enabled
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`

### Domain & SSL
- [ ] Primary domain: `agentforge-ai-page.vercel.app`
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid
- [ ] HTTPS enforced

### Security Headers (vercel.json)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] `Content-Security-Policy` configured

### Rewrites & Routing
- [ ] SPA fallback: `/* → /index.html`
- [ ] API proxy: `/api/* → https://api.agentforge.example.com/api/*`
- [ ] Clean URLs (no .html extensions)

### Caching Strategy
- [ ] Static assets: `Cache-Control: public, max-age=31536000, immutable`
- [ ] HTML: `Cache-Control: public, max-age=0, must-revalidate`
- [ ] Service worker: `Cache-Control: public, max-age=0, must-revalidate`

---

## ✅ Functional Testing

### Authentication
- [ ] Login page loads
- [ ] Valid credentials authenticate successfully
- [ ] Invalid credentials show error
- [ ] JWT tokens stored in Zustand (persisted)
- [ ] Token refresh works on 401
- [ ] Logout clears tokens and redirects
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Authenticated users access protected routes
- [ ] Page refresh maintains auth state

### Core Pages
- [ ] Dashboard - Loads KPIs, charts, recent executions
- [ ] Agents - List, filter, create, edit, delete
- [ ] Agent Detail - View details, execution history
- [ ] Tasks - List, filter, create, view details
- [ ] Executions - List, filter, view details, retry/cancel
- [ ] Analytics - Charts render, time range selector works
- [ ] Activity - Feed loads, filters work
- [ ] Tools - List, filter by category
- [ ] Integrations - Providers list, connect/disconnect, webhooks
- [ ] Permissions - List, CRUD operations
- [ ] Settings - Profile, preferences, security, system tabs

### UI/UX
- [ ] Dark/light mode toggle works
- [ ] Theme persists on refresh
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Mobile navigation drawer works
- [ ] Loading skeletons shown during data fetch
- [ ] Error states with retry buttons
- [ ] Empty states with action buttons
- [ ] Toast notifications appear
- [ ] Command palette opens (Cmd+K)
- [ ] No console errors in browser

### API Integration
- [ ] All API calls use `VITE_API_URL`
- [ ] No localhost/127.0.0.1 references in production build
- [ ] Request/response interceptors work
- [ ] Retry logic triggers on 5xx errors
- [ ] Timeout handling (30s)
- [ ] CORS configured on backend

---

## ✅ PWA Verification

### Manifest
- [ ] `manifest.json` accessible at `/manifest.json`
- [ ] Valid JSON with required fields
- [ ] Icons present (72x72 through 512x512)
- [ ] Maskable icons for Android
- [ ] Shortcuts defined

### Service Worker
- [ ] `sw.js` registers successfully
- [ ] Precaching works (all static assets)
- [ ] Runtime caching for API (NetworkFirst)
- [ ] Runtime caching for fonts (CacheFirst)
- [ ] Offline page served when disconnected
- [ ] Update prompt appears on new deployment
- [ ] `onNeedRefresh` callback works

### Installability
- [ ] Install prompt appears on supported browsers
- [ ] App installs to home screen
- [ ] Standalone display mode works
- [ ] Splash screen shows (if configured)

---

## ✅ SEO & Metadata

### HTML Head
- [ ] `<title>` unique per page (via React Helmet or similar)
- [ ] `<meta name="description">` present
- [ ] Open Graph tags (og:title, og:description, og:image, og:url)
- [ ] Twitter Card tags
- [ ] Canonical URL
- [ ] Favicon (SVG + PNG fallbacks)
- [ ] Apple touch icon
- [ ] Manifest link
- [ ] Sitemap link

### Files
- [ ] `robots.txt` at `/robots.txt`
- [ ] `sitemap.xml` at `/sitemap.xml`
- [ ] Both accessible and valid

---

## ✅ Performance

### Bundle Analysis
- [ ] Vendor chunk < 400KB gzipped
- [ ] UI chunk < 150KB gzipped
- [ ] Total JS < 500KB gzipped
- [ ] CSS < 50KB gzipped
- [ ] No duplicate dependencies in chunks

### Core Web Vitals (Target)
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTFB < 600ms

### Loading
- [ ] Critical CSS inlined (if applicable)
- [ ] Fonts preloaded
- [ ] API domain preconnected
- [ ] Images lazy-loaded
- [ ] Routes code-split

---

## ✅ Accessibility

- [ ] Semantic HTML structure
- [ ] ARIA labels on interactive elements
- [ ] Focus visible on all focusable elements
- [ ] Color contrast ratios (WCAG AA)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Alt text on images
- [ ] Form labels associated

---

## ✅ Post-Deployment

### Smoke Tests (Production URL)
- [ ] `https://agentforge-ai-page.vercel.app` returns 200
- [ ] Login flow works end-to-end
- [ ] Dashboard loads with real data
- [ ] All navigation works
- [ ] API calls succeed (check Network tab)
- [ ] No mixed content warnings
- [ ] Service worker active
- [ ] PWA installable

### Monitoring
- [ ] Vercel Analytics enabled (optional)
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured
- [ ] GitHub Actions workflow runs on push

### Documentation
- [ ] `DEPLOYMENT.md` committed
- [ ] `CHANGELOG.md` updated
- [ ] README.md reflects current setup

---

## ✅ Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Frontend Lead | | | |
| DevOps Engineer | | | |
| QA Lead | | | |
| Product Owner | | | |

---

## 📋 Rollback Plan

If critical issues detected post-deployment:

1. **Immediate**: Promote previous Vercel deployment
2. **Within 1 hour**: Revert Git commit, push to main
3. **Investigation**: Check Vercel logs, GitHub Actions, browser console
4. **Communication**: Notify team via Slack/email
5. **Post-mortem**: Document root cause, add prevention

---

*Checklist Version: 1.0.0*
*Last Updated: 2026-09-05*
*Project: AgentForge Frontend*