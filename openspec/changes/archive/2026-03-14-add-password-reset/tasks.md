## 1. Backend Implementation
- [x] 1.1 Add SHA256 encrypted reset code constant in server/index.ts
- [x] 1.2 Implement /api/auth/verify-reset-code endpoint
- [x] 1.3 Implement /api/auth/reset-password endpoint
- [x] 1.4 Add temporary token generation with 10-minute expiry

## 2. Frontend Implementation
- [x] 2.1 Update LoginPage "Forgot Password" link to open modal
- [x] 2.2 Create ResetPasswordModal component
- [x] 2.3 Create SetNewPasswordPage component
- [x] 2.4 Add reset token handling in authStore
- [x] 2.5 Add i18n translations for reset flow

## 3. Integration & Testing
- [x] 3.1 Test reset code verification flow
- [x] 3.2 Test password reset with valid token
- [x] 3.3 Test password reset with expired token
- [x] 3.4 Run type check (npx tsc --noEmit)
