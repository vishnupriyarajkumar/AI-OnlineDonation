import axiosInstance from './axiosInstance';

/**
 * Auth API service — new flow:
 *
 *  register()        → POST /api/auth/register       — creates account, sends OTP to email
 *  verifyAccount()   → POST /api/auth/verify-account — one-time OTP check, returns JWT
 *  resendOtp()       → POST /api/auth/resend-otp     — resend with 30s cooldown
 *  login()           → POST /api/auth/login          — email+password, JWT returned directly
 *  logout()          → POST /api/auth/logout
 *  refreshToken()    → POST /api/auth/refresh-token
 */

/** Register — creates account (unverified), sends OTP to email or mobile */
export const register = async (payload) => {
  const res = await axiosInstance.post('/api/auth/register', payload);
  return res.data?.data;
};

/** One-time account verification via email OTP (registration only) */
export const verifyAccount = async (email, otp) => {
  const res = await axiosInstance.post('/api/auth/verify-account', { email, otp });
  return res.data?.data; // { accessToken, role, fullName, userId }
};

/** Resend verification OTP (only for unverified accounts) */
export const resendOtp = async (identifier) => {
  const res = await axiosInstance.post('/api/auth/resend-otp', null, {
    params: { email: identifier },   // param name is 'email' on backend; accepts phone too
  });
  return res.data?.data;
};

/** Login — email + password → JWT directly (no OTP if already verified) */
export const login = async (email, password, rememberMe = false) => {
  const res = await axiosInstance.post('/api/auth/login', { email, password, rememberMe });
  return res.data?.data;
  // Verified:   { accessToken, role, fullName, userId, needsVerification: false }
  // Unverified: { needsVerification: true, email, resendCooldownSeconds }
};

/** Logout */
export const logout = async () => {
  await axiosInstance.post('/api/auth/logout');
};
