// src/pages/ForgotPasswordPage.tsx — Forgot password (AgentForge V2)
// Step 1: email -> OTP sent (mode="reset")
// Step 2: verify code -> single-use reset token
// Step 3: set new password + confirm -> reset token consumed -> auto login

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck, RefreshCw } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  savePendingAuth, 
  loadPendingAuth, 
  clearPendingAuth,
  updatePendingAuth,
  getRemainingVerifyTime,
  getRemainingResendCooldown
} from '@/lib/authSession';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { OtpSendSteps } from '@/components/auth/OtpSendSteps';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const otpSchema = z.object({
  token: z
    .string()
    .length(8, 'Enter the 8-digit code')
    .regex(/^\d{8}$/, 'Code must be 8 digits'),
});

const passwordSchema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, resetPassword } = useAuth();
  const { addToast } = useToast();

  // Initialize state from sessionStorage if available
  const [step, setStep] = useState<'email' | 'otp' | 'new-password'>(() => {
    const saved = loadPendingAuth();
    // Only restore if it's a valid step for password reset
    const validSteps = ['email', 'otp', 'new-password'] as const;
    if (saved?.step && validSteps.includes(saved.step as typeof validSteps[number])) {
      return saved.step as 'email' | 'otp' | 'new-password';
    }
    return 'email';
  });
  const [email, setEmail] = useState(() => {
    const saved = loadPendingAuth();
    return saved?.email ?? '';
  });
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(() => getRemainingResendCooldown());
  const [verifyCountdown, setVerifyCountdown] = useState(() => getRemainingVerifyTime());

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    if (email && (step === 'otp' || step === 'new-password')) {
      savePendingAuth({
        email,
        mode: 'reset',
        step,
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        verifyCountdown,
        resendCooldown,
      });
    }
  }, [email, step, verifyCountdown, resendCooldown]);

  // Countdown timers
  useEffect(() => {
    if (step === 'otp' || step === 'new-password') {
      const interval = setInterval(() => {
        setVerifyCountdown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        
        // Update sessionStorage periodically
        updatePendingAuth({ verifyCountdown: getRemainingVerifyTime() - 1, resendCooldown: getRemainingResendCooldown() - 1 });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0) return;
    try {
      await sendOtp.mutateAsync({ email, mode: 'reset' });
      setResendCooldown(60);
      setVerifyCountdown(600);
      addToast({
        type: 'success',
        title: 'Code resent',
        description: `A new 8-digit code was sent to ${email}.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to resend code',
        description: getAuthErrorMessage(error),
      });
    }
  };

  const onEmailSubmit = async (data: EmailForm) => {
    try {
      await sendOtp.mutateAsync({ email: data.email, mode: 'reset' });
      setEmail(data.email);
      otpForm.setValue('token', '');
      setStep('otp');
      setResendCooldown(60);
      setVerifyCountdown(600);
      addToast({
        type: 'success',
        title: 'Code sent',
        description: `An 8-digit code was sent to ${data.email}.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to send code',
        description: getAuthErrorMessage(error),
      });
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    try {
      const res = await verifyOtp.mutateAsync({
        email,
        token: data.token,
        mode: 'reset',
      });
      if (res.reset_token) {
        setResetToken(res.reset_token);
        passwordForm.reset();
        setStep('new-password');
        setVerifyCountdown(900); // 15 minutes for password reset
      } else {
        throw new Error('No reset token received. Please try again.');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Verification failed',
        description: getAuthErrorMessage(error),
      });
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!resetToken) return;
    try {
      await resetPassword.mutateAsync({
        reset_token: resetToken,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      clearPendingAuth();
      addToast({
        type: 'success',
        title: 'Password updated',
        description: 'Signing you in...',
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to reset password',
        description: getAuthErrorMessage(error),
      });
    }
  };

  const stepMeta = {
    email: {
      title: 'Reset password',
      subtitle: "Enter your email — we'll send an 8-digit code to verify it.",
    },
    otp: {
      title: 'Check your inbox',
      subtitle: `Enter the 8-digit code sent to ${email || 'your email'}.`,
    },
    'new-password': {
      title: 'Set a new password',
      subtitle: 'Choose a new password for your account.',
    },
  } as const;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[360px] rounded-full opacity-[0.09]" style={{ background: 'radial-gradient(ellipse at center, rgba(255,246,222,0.16) 0%, transparent 70%)', filter: 'blur(6px)' }} />
        <div className="absolute top-[18%] -right-24 w-[520px] h-[520px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, rgba(201,168,106,0.20) 0%, transparent 66%)', filter: 'blur(28px)' }} />
        <div className="absolute inset-0 tech-grid-soft opacity-[0.5]" />
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header — transparent, larger */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-6">
            <img src="/agentforge-logo.png" alt="AgentForge" className="h-[84px] md:h-[92px] w-auto object-contain drop-shadow-[0_0_22px_rgba(255,255,255,0.18)]" />
          </div>
          <h1 className="font-heading text-3xl font-bold headline-gradient">{stepMeta[step].title}</h1>
          <p className="text-text-body mt-2">{stepMeta[step].subtitle}</p>
        </div>

        {/* Form */}
        <Card className="p-8 card-premium">
          <div className="mb-5">
            <OtpSendSteps
              status={
                sendOtp.isPending
                  ? 'pending'
                  : sendOtp.isError
                    ? 'error'
                    : sendOtp.data
                      ? 'success'
                      : 'idle'
              }
              data={sendOtp.data}
              error={sendOtp.error}
            />
          </div>
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                {...emailForm.register('email')}
                error={emailForm.formState.errors.email?.message}
                autoComplete="email"
              />

              {sendOtp.isError && (
                <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-600">
                  {sendOtp.error ? getAuthErrorMessage(sendOtp.error) : 'Failed to send code'}
                </div>
              )}

              <Button
                type="submit"
                disabled={sendOtp.isPending || emailForm.formState.isSubmitting}
                className="w-full"
                size="lg"
              >
                {sendOtp.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Mail size={16} />
                    Send verification code
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,244,220,0.04)', borderColor: 'rgba(255,244,220,0.08)' }}>
                <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: '#e9cc8b' }} />
                <p className="text-sm text-text-body">
                  The code verifies your identity — no password is required yet.
                </p>
              </div>

              <Input
                label="8-digit code"
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="00000000"
                {...otpForm.register('token')}
                error={otpForm.formState.errors.token?.message}
                autoComplete="one-time-code"
                className="text-center text-lg tracking-[0.5em] font-mono"
              />

              {/* Countdown & Resend */}
              <div className="flex items-center justify-between text-sm text-text-muted">
                <span>Code expires in <strong className="font-mono text-brand-primary">{formatTime(verifyCountdown)}</strong></span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || verifyOtp.isPending}
                >
                  {resendCooldown > 0 ? (
                    <>
                      <RefreshCw size={14} className="mr-1" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} className="mr-1" />
                      Resend code
                    </>
                  )}
                </Button>
              </div>

              {verifyOtp.isError && (
                <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-600">
                  {verifyOtp.error ? getAuthErrorMessage(verifyOtp.error) : 'Invalid code'}
                </div>
              )}

              <Button
                type="submit"
                disabled={verifyOtp.isPending || otpForm.formState.isSubmitting}
                className="w-full"
                size="lg"
              >
                {verifyOtp.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <KeyRound size={16} />
                    Verify code
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 'new-password' && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                {...passwordForm.register('new_password')}
                error={passwordForm.formState.errors.new_password?.message}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your new password"
                {...passwordForm.register('confirm_password')}
                error={passwordForm.formState.errors.confirm_password?.message}
                autoComplete="new-password"
              />

              {resetPassword.isError && (
                <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-600">
                  {resetPassword.error ? getAuthErrorMessage(resetPassword.error) : 'Failed to reset password'}
                </div>
              )}

              <Button
                type="submit"
                disabled={resetPassword.isPending || passwordForm.formState.isSubmitting}
                className="w-full"
                size="lg"
              >
                {resetPassword.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <KeyRound size={16} />
                    Update password
                  </>
                )}
              </Button>
            </form>
          )}

          {step !== 'email' && (
            <button
              type="button"
              onClick={() => setStep(step === 'new-password' ? 'otp' : 'email')}
              className="w-full mt-5 inline-flex justify-center items-center gap-1.5 text-sm text-text-muted hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}
        </Card>

        <p className="text-center text-sm text-text-muted mt-8">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-brand-primary hover:text-brand-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}