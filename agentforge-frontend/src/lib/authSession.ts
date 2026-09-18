// src/lib/authSession.ts
// Session persistence utilities for auth flows (OTP verification, password reset, etc.)

interface PendingAuthState {
  email: string;
  mode: 'register' | 'reset';
  step: 'details' | 'email' | 'otp' | 'new-password';
  // Registration data
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  password?: string;
  phone?: string;
  organizationLogo?: string;
  // Timestamps
  createdAt: number;
  expiresAt: number;
  // Verification countdown
  verifyCountdown: number;
  resendCooldown: number;
}

const STORAGE_KEY = 'agentforge_pending_auth';
const STORAGE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes (longer than OTP expiry)

/**
 * Save pending auth state to sessionStorage
 */
export function savePendingAuth(state: PendingAuthState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save pending auth state:', e);
  }
}

/**
 * Load pending auth state from sessionStorage
 * Returns null if not found or expired
 */
export function loadPendingAuth(): PendingAuthState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state: PendingAuthState = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() > state.expiresAt) {
      clearPendingAuth();
      return null;
    }
    
    // Recalculate countdowns based on elapsed time
    const elapsed = Math.floor((Date.now() - state.createdAt) / 1000);
    state.verifyCountdown = Math.max(0, state.verifyCountdown - elapsed);
    state.resendCooldown = Math.max(0, state.resendCooldown - elapsed);
    
    return state;
  } catch (e) {
    console.warn('Failed to load pending auth state:', e);
    return null;
  }
}

/**
 * Clear pending auth state
 */
export function clearPendingAuth(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear pending auth state:', e);
  }
}

/**
 * Update specific fields in pending auth state
 */
export function updatePendingAuth(updates: Partial<PendingAuthState>): PendingAuthState | null {
  const current = loadPendingAuth();
  if (!current) return null;
  
  const updated = { ...current, ...updates };
  savePendingAuth(updated);
  return updated;
}

/**
 * Check if there's a valid pending auth state
 */
export function hasPendingAuth(): boolean {
  return loadPendingAuth() !== null;
}

/**
 * Get the remaining verification time in seconds
 */
export function getRemainingVerifyTime(): number {
  const state = loadPendingAuth();
  return state?.verifyCountdown ?? 0;
}

/**
 * Get the remaining resend cooldown in seconds
 */
export function getRemainingResendCooldown(): number {
  const state = loadPendingAuth();
  return state?.resendCooldown ?? 0;
}