// src/pages/RegisterPage.tsx — Email OTP registration (AgentForge V2)

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, ShieldCheck, KeyRound, Building2, UploadCloud, RefreshCw } from 'lucide-react';

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
import { AuthParticles } from '@/components/effects/AuthParticles';

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    organization_name: z.string().min(2, 'Organization name is required'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

const otpSchema = z.object({
  token: z
    .string()
    .length(8, 'Enter the 8-digit code')
    .regex(/^\d{8}$/, 'Code must be 8 digits'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();
  const { addToast } = useToast();
  
  // Initialize state from sessionStorage if available
  const [step, setStep] = useState<'details' | 'otp'>(() => {
    const saved = loadPendingAuth();
    // Only restore if it's a valid step for registration
    const validSteps = ['details', 'otp'] as const;
    if (saved?.step && validSteps.includes(saved.step as typeof validSteps[number])) {
      return saved.step as 'details' | 'otp';
    }
    return 'details';
  });
  const [pendingData, setPendingData] = useState<RegisterFormData | null>(() => {
    const saved = loadPendingAuth();
    return saved ? {
      first_name: saved.firstName ?? '',
      last_name: saved.lastName ?? '',
      email: saved.email,
      organization_name: saved.organizationName ?? '',
      phone: saved.phone ?? '',
      password: saved.password ?? '',
      confirm_password: saved.password ?? '',
    } : null;
  });
  const [logoBase64, setLogoBase64] = useState<string | undefined>(() => {
    const saved = loadPendingAuth();
    return saved?.organizationLogo;
  });
  const [resendCooldown, setResendCooldown] = useState(() => getRemainingResendCooldown());
  const [verifyCountdown, setVerifyCountdown] = useState(() => getRemainingVerifyTime());

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: pendingData ?? undefined,
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    if (pendingData && (step === 'otp' || step === 'details')) {
      savePendingAuth({
        email: pendingData.email,
        mode: 'register',
        step,
        firstName: pendingData.first_name,
        lastName: pendingData.last_name,
        organizationName: pendingData.organization_name,
        password: pendingData.password,
        phone: pendingData.phone,
        organizationLogo: logoBase64,
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        verifyCountdown,
        resendCooldown,
      });
    }
  }, [pendingData, step, logoBase64, verifyCountdown, resendCooldown]);

  // Countdown timers
  useEffect(() => {
    if (step === 'otp') {
      const interval = setInterval(() => {
        setVerifyCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
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

  const onLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoBase64(typeof reader.result === 'string' ? reader.result : undefined);
    reader.readAsDataURL(file);
  };

  const handleResendOtp = async () => {
    if (!pendingData || resendCooldown > 0) return;
    try {
      await sendOtp.mutateAsync({
        email: pendingData.email,
        mode: 'register',
        password: pendingData.password,
        first_name: pendingData.first_name,
        last_name: pendingData.last_name,
        organization_name: pendingData.organization_name,
        organization_logo: logoBase64,
        phone: pendingData.phone,
      });
      setResendCooldown(60);
      setVerifyCountdown(600);
      addToast({
        type: 'success',
        title: 'Code resent',
        description: `A new 8-digit code was sent to ${pendingData.email}.`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to resend code',
        description: error instanceof Error ? error.message : 'Unable to send OTP.',
      });
    }
  };

  const onSubmitDetails = async (data: RegisterFormData) => {
    try {
      await sendOtp.mutateAsync({
        email: data.email,
        mode: 'register',
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        organization_name: data.organization_name,
        organization_logo: logoBase64,
        phone: data.phone,
      });
      setPendingData(data);
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

  const onSubmitOtp = async (data: OtpFormData) => {
    if (!pendingData) return;
    try {
      await verifyOtp.mutateAsync({
        email: pendingData.email,
        token: data.token,
        mode: 'register',
        password: pendingData.password,
        first_name: pendingData.first_name,
        last_name: pendingData.last_name,
        organization_name: pendingData.organization_name,
        organization_logo: logoBase64,
        phone: pendingData.phone || undefined,
      });
      clearPendingAuth();
      addToast({
        type: 'success',
        title: 'Account created',
        description: `${pendingData.organization_name} is ready. Welcome to AgentForge!`,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Verification failed',
        description: getAuthErrorMessage(error),
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
      {/* white glowing particles — floating beauty (register) */}
      <AuthParticles count={52} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[360px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(ellipse at center, rgba(255,246,222,0.12) 0%, transparent 70%)', filter: 'blur(6px)' }} />
        <div className="absolute top-[18%] -right-24 w-[520px] h-[520px] rounded-full opacity-[0.035]" style={{ background: 'radial-gradient(circle, rgba(201,168,106,0.16) 0%, transparent 66%)', filter: 'blur(28px)' }} />
        <div className="absolute inset-0 tech-grid-soft opacity-[0.35]" />
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header — transparent, larger */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-6">
            <img src="/agentforge-logo.png" alt="AgentForge" className="h-[84px] md:h-[92px] w-auto object-contain drop-shadow-[0_0_22px_rgba(255,255,255,0.18)]" />
          </div>
          <h1 className="font-heading text-3xl font-bold headline-gradient">
            {step === 'details' ? 'Create your workspace' : 'Verify your email'}
          </h1>
          <p className="text-text-body mt-2">
            {step === 'details'
              ? 'Set up your account and organization.'
              : `Enter the 8-digit code sent to ${pendingData?.email || 'your email'}. After verification you'll sign in with the password you created.`}
          </p>
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
          {step === 'details' ? (
            <form onSubmit={form.handleSubmit(onSubmitDetails)} className="space-y-5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,244,220,0.04)', borderColor: 'rgba(255,244,220,0.08)' }}>
                <Building2 className="h-5 w-5 shrink-0" style={{ color: '#e9cc8b' }} />
                <p className="text-sm text-text-body">
                  After verification you'll become the Workspace Owner (Project Manager).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  placeholder="Jane"
                  {...form.register('first_name')}
                  error={form.formState.errors.first_name?.message}
                  autoComplete="given-name"
                />
                <Input
                  label="Last Name *"
                  placeholder="Doe"
                  {...form.register('last_name')}
                  error={form.formState.errors.last_name?.message}
                  autoComplete="family-name"
                />
              </div>

              <Input
                label="Email *"
                type="email"
                placeholder="you@company.com"
                {...form.register('email')}
                error={form.formState.errors.email?.message}
                autoComplete="email"
              />

              <Input
                label="Organization Name *"
                placeholder="Acme Corp"
                {...form.register('organization_name')}
                error={form.formState.errors.organization_name?.message}
              />

              <Input
                label="Password *"
                type="password"
                placeholder="At least 8 characters"
                {...form.register('password')}
                error={form.formState.errors.password?.message}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password *"
                type="password"
                placeholder="Re-enter your password"
                {...form.register('confirm_password')}
                error={form.formState.errors.confirm_password?.message}
                autoComplete="new-password"
              />

              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="+1 555 000 0000"
                {...form.register('phone')}
                error={form.formState.errors.phone?.message}
                autoComplete="tel"
              />

              {/* Organization Logo (optional) */}
              <div className="space-y-1.5">
                <label className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-canvas-border rounded-xl cursor-pointer hover:border-brand-primary/50 hover:bg-canvas-surface/50 transition-colors">
                  <UploadCloud className="h-6 w-6 text-text-muted" />
                  <span className="text-sm font-medium text-text-body">
                    {logoBase64 ? 'Organization logo selected' : 'Upload Organization Logo (optional)'}
                  </span>
                  <span className="text-xs text-text-muted">PNG, JPG or SVG</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                </label>
                {logoBase64 && (
                  <div className="flex items-center gap-2">
                    <img src={logoBase64} alt="Logo preview" className="w-10 h-10 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setLogoBase64(undefined)}
                      className="text-xs text-error-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {sendOtp.isError && (
                <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-600">
                  {sendOtp.error ? getAuthErrorMessage(sendOtp.error) : 'Failed to send code'}
                </div>
              )}

              <Button
                type="submit"
                disabled={sendOtp.isPending || form.formState.isSubmitting}
                className="w-full"
                size="lg"
              >
                {sendOtp.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Send verification code
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,244,220,0.04)', borderColor: 'rgba(255,244,220,0.08)' }}>
                <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: '#e9cc8b' }} />
                <p className="text-sm text-text-body">
                  On verification your account and workspace are created. You'll then be taken to your dashboard.
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
                    Verify & create account
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep('details')}
                className="w-full text-center text-sm text-text-muted hover:text-brand-primary transition-colors"
              >
                Back to details
              </button>
            </form>
          )}
        </Card>

        <p className="text-center text-sm text-text-muted mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-primary hover:text-brand-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}