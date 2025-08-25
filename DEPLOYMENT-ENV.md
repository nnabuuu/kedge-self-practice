# 🔧 Deployment Environment Variables

## Frontend Practice App (.env.production)

```env
# Backend API URL
VITE_API_BASE_URL=https://cyez.zhushou.one

# Quiz Parser URL (for teacher navigation)
VITE_QUIZ_PARSER_URL=https://cyez.zhushou.one/parser
```

## Frontend Quiz Parser App (.env.production)

```env
# Backend API URL
VITE_API_BASE_URL=https://cyez.zhushou.one
```

## Important Notes

### For Production Deployment:
1. **Frontend Practice** needs to know where the Quiz Parser is located
   - Teachers can navigate from Practice app to Parser app
   - Authentication token is shared between apps

2. **Quiz Parser** needs the backend API URL
   - Uses the same backend as the Practice app
   - Served from `/parser` path

### For Local Development:
```env
# frontend-practice/.env.development
VITE_API_BASE_URL=http://localhost:8718
VITE_QUIZ_PARSER_URL=http://localhost:5174

# frontend-quiz-parser/.env.development
VITE_API_BASE_URL=http://localhost:8718
```

### URL Structure:
- **Main Site**: `https://cyez.zhushou.one` → Practice App
- **Parser**: `https://cyez.zhushou.one/parser` → Quiz Parser
- **API**: `https://cyez.zhushou.one/v1/*` → Backend API (proxied)

### Authentication Flow:
1. User logs in on Practice app
2. JWT token stored in localStorage
3. When navigating to Parser, token is passed via URL params
4. Parser app receives and uses the same token
5. Both apps share the same backend authentication

## Nginx Proxy Configuration

The nginx server proxies API requests:
- Requests to `/v1/*` → `http://localhost:8718` (or your backend server)
- Update in `/etc/nginx/sites-available/cyez` if backend is on different server

## Deployment Checklist

- [ ] Set correct `VITE_API_BASE_URL` for both apps
- [ ] Set `VITE_QUIZ_PARSER_URL` for practice app
- [ ] Build practice app without base path
- [ ] Build parser app with `base: '/parser/'`
- [ ] Update nginx `proxy_pass` to correct backend URL
- [ ] Ensure SSL certificate is configured
- [ ] Test authentication flow between apps