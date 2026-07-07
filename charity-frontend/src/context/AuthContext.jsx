import { createContext, useContext, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

/**
 * Auth state:
 *
 *  user               — fully authenticated user (has accessToken)
 *  pendingVerification — email that registered but hasn't verified yet
 *
 * Flow:
 *  Register  → setPendingVerification(email) → /verify-account page
 *  Verify    → login(userData)               → dashboard
 *  Login     → login(userData) directly      → dashboard  (no OTP)
 *  Logout    → clears user, keeps DB data intact
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('auth_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const [pendingVerification, setPendingVerificationState] = useState(
    () => sessionStorage.getItem('pending_verify_email') || null
  );

  /** Store fully authenticated user after login or account verification */
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    if (userData.accessToken)
      localStorage.setItem('access_token', userData.accessToken);
    sessionStorage.removeItem('pending_verify_email');
    setPendingVerificationState(null);
  };

  /** Called after registration — email needs OTP verification */
  const setPendingVerification = (email) => {
    sessionStorage.setItem('pending_verify_email', email);
    setPendingVerificationState(email);
  };

  /** Cancel verification and go back to register/login */
  const clearPendingVerification = () => {
    sessionStorage.removeItem('pending_verify_email');
    setPendingVerificationState(null);
  };

  const logout = async () => {
    try { await axiosInstance.post('/api/auth/logout'); } catch {}
    setUser(null);
    setPendingVerificationState(null);
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isUser  = () => user?.role === 'USER';

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      pendingVerification, setPendingVerification, clearPendingVerification,
      isAdmin, isUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
