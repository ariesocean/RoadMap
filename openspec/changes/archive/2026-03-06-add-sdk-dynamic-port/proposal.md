# Change: Add SDK Dynamic Port Configuration

## Why
The multi-user authentication system assigns each user a unique OpenCode server port, but the SDK client was using a fixed baseUrl. This prevented proper multi-user isolation - all users would connect to the same default port (51432) instead of their assigned port.

## What Changes
- Add `getBaseUrl()` function to dynamically read userPort from authStore
- Add `updateClientBaseUrl()` function to reset client instance when user logs in
- Call `updateClientBaseUrl()` after login/register/auto-login succeeds
- Remove redundant else branch in `getClient()` that was recreating instance unnecessarily

## Impact
- Affected specs: `session` (MODIFIED - SDK client initialization), `auth` (MODIFIED - login flow)
- Affected code:
  - `roadmap-manager/src/services/opencodeClient.ts` - Dynamic baseUrl + reset function
  - `roadmap-manager/src/pages/LoginPage.tsx` - Call updateClientBaseUrl() on login
  - `roadmap-manager/src/main.tsx` - Call updateClientBaseUrl() on auto-login
