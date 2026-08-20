import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const { addToast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = (data: ForgotForm) => {
    // Call API
    addToast({ type: 'success', title: 'Reset link sent', description: `If an account exists for ${data.email}, you will receive an email.` });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="text-base-400 mt-2">Enter your email to receive a reset link</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@company.com" {...register('email')} error={errors.email?.message} />
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-base-400 mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-electric-400 hover:text-electric-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}