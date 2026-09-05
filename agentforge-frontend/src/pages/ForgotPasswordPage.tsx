import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark mx-auto mb-6">
            <span className="font-logo font-bold text-white text-xl">AF</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Reset password</h1>
          <p className="text-text-body mt-2">Enter your email to receive a reset link</p>
        </div>
        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Email" type="email" placeholder="you@company.com" {...register('email')} error={errors.email?.message} autoComplete="email" />
            <Button type="submit" className="w-full" size="lg">
              Send reset link
              <ArrowRight size={18} />
            </Button>
          </form>
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