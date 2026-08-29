// src/pages/LoginPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login.mutateAsync(data);
      addToast({
        type: 'success',
        title: 'Welcome back',
        description: 'Successfully signed in.',
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark mx-auto mb-6">
            <span className="font-logo font-bold text-white text-xl">AF</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Welcome back</h1>
          <p className="text-text-body mt-2">Sign in to continue to AgentForge</p>
        </div>

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              error={errors.email?.message}
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  error={errors.password?.message}
                  className="pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-body cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-canvas-border bg-canvas-surface text-brand-primary focus:ring-brand-primary/20" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover">
                Forgot password?
              </Link>
            </div>

            {login.isError && (
              <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-600">
                {login.error instanceof Error ? login.error.message : 'Login failed'}
              </div>
            )}

            <Button
              type="submit"
              disabled={login.isPending || isSubmitting}
              className="w-full"
              size="lg"
            >
              {login.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
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