// src/lib/authErrors.ts
// User-friendly error message mapping for authentication errors

export type AuthErrorType = 
  | 'INVALID_FORMAT'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'OTP_LOCKED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'SMTP_FAILED'
  | 'NETWORK_FAILURE'
  | 'INVALID_RESET_TOKEN'
  | 'RESET_TOKEN_EXPIRED'
  | 'RESET_TOKEN_USED'
  | 'PASSWORD_REQUIRED'
  | 'OTP_RESEND_LIMIT'
  | 'UNKNOWN_ERROR';

/**
 * Maps backend error codes/types to user-friendly messages
 */
export const authErrorMessages: Record<AuthErrorType, string> = {
  INVALID_FORMAT: 'The verification code is incorrect.',
  INVALID_OTP: 'The verification code you entered is incorrect.',
  OTP_EXPIRED: 'This verification code has expired. Please request a new code.',
  OTP_LOCKED: 'Too many incorrect attempts. Please request a new verification code.',
  EMAIL_ALREADY_EXISTS: 'This email is already registered with AgentForge.',
  SMTP_FAILED: 'We couldn\'t send the verification email. Please try again later.',
  NETWORK_FAILURE: 'Network error. Please check your connection and try again.',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token. Request a new code.',
  RESET_TOKEN_EXPIRED: 'Reset token has expired. Request a new code.',
  RESET_TOKEN_USED: 'This reset link has already been used. Request a new code.',
  PASSWORD_REQUIRED: 'Password is required to finish registration.',
  OTP_RESEND_LIMIT: 'Please wait before requesting another code.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Gets a user-friendly error message from an error object
 */
export function getAuthErrorMessage(error: unknown): string {
  // Handle axios errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { 
      response?: { 
        data?: { 
          message?: string; 
          errorType?: string;
          detail?: string;
          retryAfter?: number;
        }; 
        status?: number;
      }; 
      message?: string;
    };
    
    // Check for structured error response with errorType
    if (axiosError.response?.data?.errorType) {
      const errorType = axiosError.response.data.errorType as AuthErrorType;
      if (authErrorMessages[errorType]) {
        return authErrorMessages[errorType];
      }
    }
    
    // Check for message in response
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    // Check for detail in response
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    
    // Check for status codes
    if (axiosError.response?.status === 429 && axiosError.response.data?.retryAfter) {
      return `Please wait ${axiosError.response.data.retryAfter} seconds before requesting another code.`;
    }
    
    if (axiosError.response?.status === 409) {
      return authErrorMessages.EMAIL_ALREADY_EXISTS;
    }
    
    if (axiosError.response?.status === 0 || axiosError.response?.status === 500) {
      return authErrorMessages.NETWORK_FAILURE;
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    // Check if the message matches a known error type
    for (const [key, message] of Object.entries(authErrorMessages)) {
      if (error.message.includes(key)) {
        return message;
      }
    }
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    for (const [key, message] of Object.entries(authErrorMessages)) {
      if (error.includes(key)) {
        return message;
      }
    }
    return error;
  }
  
  return authErrorMessages.UNKNOWN_ERROR;
}

/**
 * Gets the retry-after seconds from an error if available
 */
export function getRetryAfter(error: unknown): number | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { 
      response?: { 
        data?: { 
          retryAfter?: number;
        }; 
      }; 
    };
    return axiosError.response?.data?.retryAfter ?? null;
  }
  return null;
}