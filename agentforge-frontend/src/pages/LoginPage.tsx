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

// ─── Form schema ─────────────────────────────────────────────
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
      navigate('/dashboard',{replace: true});
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-electric-500 to-violet-600 mb-4">
            <span className="text-white font-bold text-xl">AF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-base-400 mt-2">Sign in to continue to AgentForge</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  error={errors.password?.message}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-500 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-base-400">
                <input type="checkbox" className="rounded border-base-700 bg-base-800" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-electric-400 hover:text-electric-300">
                Forgot password?
              </Link>
            </div>

            {login.isError && (
              <div className="p-3 bg-error-700/10 border border-error-700/30 rounded-lg text-sm text-error-500">
                {login.error instanceof Error ? login.error.message : 'Login failed'}
              </div>
            )}

            <Button
              type="submit"
              disabled={login.isPending || isSubmitting}
              className="w-full"
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
        </div>

        <p className="text-center text-sm text-base-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-electric-400 hover:text-electric-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}