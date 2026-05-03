'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/components/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Mock API delay
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 800);
  };

  return (
    <AuthCard title="Reset Password" subtitle="We'll send you instructions to reset your password">
      {!isSent ? (
        <form onSubmit={handleReset}>
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          
          <div className="mt-8">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">Check your email</h3>
          <p className="text-slate-500 mb-8">
            We&apos;ve sent a password reset link to <br/>
            <span className="font-medium text-slate-700">{email}</span>
          </p>
        </div>
      )}
      
      <p className="mt-8 text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
          Back to Login
        </Link>
      </p>
    </AuthCard>
  );
}
