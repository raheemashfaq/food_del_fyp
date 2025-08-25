# Admin Login Troubleshooting Guide

## Current Issues
1. **404 Error**: API calls going to wrong port (5000 instead of 4000)
2. **Google OAuth 403**: Origin not allowed for client ID

## Debugging Steps

### 1. Restart Both Servers
**Backend:**
```bash
cd c:\Users\muham\OneDrive\Desktop\FYP_Food\food_del_fyp\backend
npm start
```

**Admin Frontend:**
```bash
cd c:\Users\muham\OneDrive\Desktop\FYP_Food\food_del_fyp\admin
npm run dev
```

### 2. Check Environment Variables
Open browser console and check for debug logs showing:
- `Environment Variables: { VITE_API_URL: ..., VITE_GOOGLE_CLIENT_ID: ... }`
- `Using URL: ...`

### 3. Test Backend Connectivity
Open browser and visit: `http://localhost:4000/api/admin/test`
Should return: `{"success":true,"message":"Admin routes are working!"}`

### 4. Test Admin Login
Try logging in with:
- **Email**: `admin@fooddelivery.com`
- **Password**: `admin123456`

## Quick Fixes

### If API URL is still wrong:
1. Delete `node_modules` and `package-lock.json` in admin folder
2. Run `npm install` again
3. Restart dev server

### If environment variables not loading:
1. Ensure `.env` file is in admin root directory (not in src)
2. Restart the dev server
3. Check if there are multiple `.env` files

### Create Initial Admin (if needed):
```bash
cd c:\Users\muham\OneDrive\Desktop\FYP_Food\food_del_fyp\backend
node createAdmin.js
```

## Expected Behavior
1. Admin panel should show login popup on startup
2. After successful login, main admin dashboard should appear
3. Logout button should be visible in navbar
4. Console should show correct API URL (localhost:4000)

## Google OAuth Fix (Later)
The Google OAuth issue is secondary. Once main login works:
1. Ensure domain is added to Google Console
2. Re-enable Google OAuth in AdminLoginPopup.jsx