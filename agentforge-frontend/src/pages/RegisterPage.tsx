// src/pages/RegisterPage.tsx

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

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, ...payload } = data;

    try {
      await registerUser.mutateAsync(payload);
      addToast({
        type: 'success',
        title: 'Account created',
        description: 'Welcome to AgentForge.',
      });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed';

      addToast({
        type: 'error',
        title: 'Registration failed',
        description: message,
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
          <h1 className="font-heading text-3xl font-bold text-text-heading">Create account</h1>
          <p className="text-text-body mt-2">Start orchestrating AI agents</p>
        </div>

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="Your name"
              {...register('name')}
              error={errors.name?.message}
              autoComplete="name"
            />

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
                  placeholder="Create a password"
                  {...register('password')}
                  error={errors.password?.message}
                  className="pr-12"
                  autoComplete="new-password"
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

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />

            {registerUser.isError && (
              <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-sm text-error-600">
                {registerUser.error instanceof Error ? registerUser.error.message : 'Registration failed'}
              </div>
            )}

            <Button
              type="submit"
              disabled={registerUser.isPending || isSubmitting}
              className="w-full"
              size="lg"
            >
              {registerUser.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>
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