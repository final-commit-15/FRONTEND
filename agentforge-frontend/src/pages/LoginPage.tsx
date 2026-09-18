// src/pages/LoginPage.tsx — Email + password login (AgentForge V2)

import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AuthParticles } from '@/components/effects/AuthParticles';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login.mutateAsync({ email: data.email, password: data.password });
      addToast({
        type: 'success',
        title: 'Welcome back',
        description: 'Successfully signed in.',
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Invalid email or password.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary relative overflow-hidden">
      {/* white glowing particles — floating beauty */}
      <AuthParticles />
      {/* premium ambient — subtle dark theme wash */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[360px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(ellipse at center, rgba(255,246,222,0.12) 0%, transparent 70%)', filter: 'blur(6px)' }} />
        <div className="absolute top-[18%] -right-24 w-[520px] h-[520px] rounded-full opacity-[0.035]" style={{ background: 'radial-gradient(circle, rgba(201,168,106,0.16) 0%, transparent 66%)', filter: 'blur(28px)' }} />
        <div className="absolute inset-0 tech-grid-soft opacity-[0.35]" />
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header — transparent full logo, larger */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-6">
            <img src="/agentforge-logo.png" alt="AgentForge" className="h-[84px] md:h-[92px] w-auto object-contain drop-shadow-[0_0_22px_rgba(255,255,255,0.18)]" />
          </div>
          <h1 className="font-heading text-3xl font-bold headline-gradient">Welcome back</h1>
          <p className="text-text-body mt-2">
            Sign in with the email and password you created at registration.
          </p>
        </div>

        {/* Form — premium */}
        <Card className="p-8 card-premium">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,244,220,0.04)', borderColor: 'rgba(255,244,220,0.08)' }}>
              <Mail className="h-5 w-5 shrink-0" style={{ color: '#e9cc8b' }} />
              <p className="text-sm text-text-body">
                Your account was created with a password during registration.
              </p>
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover"
              >
                Forgot password?
              </Link>
            </div>

            {login.isError && (
              <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-600">
                {login.error instanceof Error ? login.error.message : 'Failed to sign in'}
              </div>
            )}

            <Button
              type="submit"
              disabled={login.isPending || form.formState.isSubmitting}
              className="w-full"
              size="lg"
            >
              {login.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Lock size={16} />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-text-muted mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-primary hover:text-brand-primary-hover">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}