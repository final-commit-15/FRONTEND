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

// ─── Form schema ─────────────────────────────────────────────
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
  const { register: registerUser } = useAuth(); // renamed to avoid conflict with react-hook-form's register
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
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...payload } = data;

    try {
      await registerUser.mutateAsync(payload);
      addToast({
        type: 'success',
        title: 'Account created',
        description: 'Welcome to AgentForge.',
      });
      navigate('/dashboard');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Unable to create account.',
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
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-base-400 mt-2">Start orchestrating AI agents</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Your name"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
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

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              error={errors.confirmPassword?.message}
            />

            {registerUser.isError && (
              <div className="p-3 bg-error-700/10 border border-error-700/30 rounded-lg text-sm text-error-500">
                {registerUser.error instanceof Error
                  ? registerUser.error.message
                  : 'Registration failed'}
              </div>
            )}

            <Button
              type="submit"
              disabled={registerUser.isPending || isSubmitting}
              className="w-full"
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
        </div>

        <p className="text-center text-sm text-base-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-electric-400 hover:text-electric-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}