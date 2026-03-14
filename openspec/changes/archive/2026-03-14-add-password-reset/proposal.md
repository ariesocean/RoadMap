# Change: Add Password Reset with Hardcoded Reset Code

## Why
Currently the login page has a non-functional "Forgot Password" link. Users need a way to reset their password when forgotten.

## What Changes
- Add password reset flow using a hardcoded reset code
- Reset code: "roadmap-reset-password" (SHA256 encrypted, never changes)
- New API endpoints:
  - `/api/auth/verify-reset-code` - Verify email + reset code, return temporary token
  - `/api/auth/reset-password` - Reset password using temporary token
- Frontend:
  - Convert "Forgot Password" link to open reset modal
  - Add ResetPasswordModal component (email + reset code input)
  - Add SetNewPasswordPage for setting new password

## Impact
- Affected specs: `auth`
- Affected code:
  - `server/index.ts` - New API endpoints
  - `src/pages/LoginPage.tsx` - UI changes
  - `src/components/ResetPasswordModal.tsx` - New component
  - `src/pages/SetNewPasswordPage.tsx` - New page
  - `src/store/authStore.ts` - Token handling
