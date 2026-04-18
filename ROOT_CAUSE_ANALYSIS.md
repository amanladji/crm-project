# ROOT CAUSE ANALYSIS: Campaign Feature 403 Forbidden Error

## Error Flow Chain

```
USER INTERACTION
↓
User clicks "+ New Campaign" button
↓
handleOpenModal() executes
↓
Code: const response = await fetch('http://localhost:8081/api/users', {...})
↓
REQUEST SENT TO BACKEND
↓
Backend receives GET /api/users request
↓
JwtAuthFilter intercepts request
  ├─ Looks for "Authorization" header
  ├─ Looks for "Bearer " prefix
  └─ Extracts JWT token if present
↓
AUTHENTICATION CHECK
  ├─ Token present? 
  │  └─ If NO → parseJwt() returns null
  │      → No authentication set
  │      → Continue to SecurityConfig check
  │
  └─ Token present?
     ├─ If YES → Validate token
     ├─ If valid → Extract username, authenticate user
     └─ If invalid → No authentication set
↓
SECURITY CONFIG CHECK
  ├─ Endpoint: /api/users
  ├─ Rule: /api/** → authenticated()
  └─ Is user authenticated?
     ├─ If YES → ALLOW request ✅
     └─ If NO → DENY request, return 403 ❌
↓
403 FORBIDDEN RESPONSE
↓
Frontend receives 403
↓
catch() block executes
  └─ setUsers([])
     └─ UI renders "No users available"
↓
Campaign feature FAILS
  └─ Cannot select users
     └─ Cannot create campaign
```

---

## Root Cause: Token Not Sent (or sent incorrectly)

### Why Token Gets Lost

If any of these fail:
1. **Token not stored in localStorage** → fetch() won't find it
2. **Token stored under wrong key** → fetch() retrieves null
3. **Token retrieval code is wrong** → Manual extraction fails
4. **Token extraction not done** → Authorization header not added
5. **Token sent without "Bearer " prefix** → JWT filter rejects it

### The Specific Problem Found

**Before Fix:**
```javascript
// Dashboard.jsx was trying to get token from wrong location
const token = localStorage.getItem('token');  // ❌ Returns null!
// Because auth.service.js stores it as:
localStorage.setItem('user', JSON.stringify(response.data));
```

**Key Discovery:**
- auth.service.js stores: `localStorage['user'] = {token: "...", username: "...", email: "...", role: "..."}`
- Dashboard.jsx was trying: `localStorage['token'] = null`
- Result: **Authorization header was empty or missing → 403 Forbidden**

---

## The Fix Applied

```javascript
// BEFORE (❌ Wrong - token is null):
const token = localStorage.getItem('token');
// Result: token = null
// Request sent: Authorization: Bearer null ❌

// AFTER (✅ Correct):
const userStr = localStorage.getItem('user');
const user = JSON.parse(userStr);
const token = user.token;  
// Result: token = "eyJhbGc..." (actual JWT)
// Request sent: Authorization: Bearer eyJhbGc... ✅
```

---

## Verification: Complete Flow Now Works

1. **Login**
   ```
   POST /api/auth/login
   ← Response: {token: "JWT...", username: "admin", email: "admin@...", role: "..."}
   └─ Stored as: localStorage['user'] = JSON.stringify(response.data) ✅
   ```

2. **Open Campaign Modal**
   ```
   handleOpenModal() called
   ├─ userStr = localStorage.getItem('user') ✅
   ├─ user = JSON.parse(userStr) ✅
   ├─ token = user.token ✅
   └─ Authorization header = "Bearer {token}" ✅
   ```

3. **Fetch Users**
   ```
   GET /api/users
   Header: Authorization: Bearer eyJhbGc...
   ↓
   JwtAuthFilter.parseJwt() extracts "eyJhbGc..."
   ↓
   jwtUtils.validateJwtToken() validates ✅
   ↓
   User authenticated ✅
   ↓
   SecurityConfig allows request ✅
   ↓
   200 OK - Users returned ✅
   ```

4. **Selection Works**
   ```
   Users displayed in modal
   ├─ Admin checks 3 users
   ├─ selectedUsers = [2, 3, 4]
   └─ Submit sends: {name, message, userIds: [2, 3, 4]}
   ```

5. **Campaign Created**
   ```
   POST /api/campaigns with JWT token
   ├─ Auth: Bearer {token} ✅
   ├─ Backend creates campaign ✅
   ├─ Links 3 users via CampaignUser table ✅
   └─ Returns 201 Created ✅
   ```

6. **Messages Sent**
   ```
   POST /api/campaigns/send with JWT token
   ├─ Auth: Bearer {token} ✅
   ├─ Retrieves linked users ✅
   ├─ Creates ChatMessages ✅
   └─ Returns 200 OK with successCount ✅
   ```

---

## System Architecture

### Frontend Token Management
```
Login API Response
└─ {token: "...", username: "...", email: "...", role: "..."}
   └─ Stored in localStorage['user']
      ├─ auth.service.js: Stores (only place token is set)
      ├─ api.js: Axios interceptor reads and adds to requests
      └─ Dashboard.jsx: Manual extraction for fetch() calls
```

### Backend Security
```
Request comes in
└─ JwtAuthFilter (oncePerRequestFilter)
   ├─ parseJwt(): Extracts from Authorization header
   ├─ validateToken(): Checks signature and expiration
   ├─ loadUserByUsername(): Gets user details
   └─ Sets SecurityContext with authenticated user
      
Then:
SecurityConfig checks endpoint permission
└─ /api/users → requires authenticated()
   ├─ Is SecurityContext set? 
   ├─ If YES → Allow ✅
   └─ If NO → Reject 403 ❌
```

---

## Why This Was Error-Prone

1. **Mixed HTTP clients**
   - axios client (api.js) uses interceptor - token auto-added ✅
   - fetch() in Dashboard.jsx - token must be manually added ❌
   - Easy to forget in one place

2. **Token Storage Format**
   - Stored as: Object in localStorage['user']
   - Must parse JSON to access
   - If parsing skipped → null token

3. **No Single Source of Truth**
   - Token retrieval logic duplicated in Dashboard.jsx
   - Could diverge from api.js interceptor
   - Creates maintenance burden

---

## Best Practices for Prevention

1. **Use axios client everywhere** (not raw fetch)
   ```javascript
   // Good - automatic token injection
   const response = await api.get('/users');
   
   // Bad - must remember to add token manually
   const response = await fetch('/users', {
     headers: { Authorization: ... }
   });
   ```

2. **Centralize token management**
   - Single place to read token (auth.service.js) ✅
   - Single place to add token (api.js interceptor) ✅

3. **Test token flow**
   - Verify localStorage content
   - Log token before sending
   - Check Authorization header in Network tab

---

## Current Status

✅ **Root cause identified**: Token stored in wrong location for retrieval
✅ **Fix applied**: Correct token retrieval in Dashboard.jsx  
✅ **Verification**: 3-user and 1-user tests both passed
✅ **Flow working**: Login → Users fetched → Selected → Campaign created → Messages sent

---

Generated: April 14, 2026
