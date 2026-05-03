'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthCard } from '@/components/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Mock login delay
    setTimeout(() => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      router.push('/dashboard');
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Mock google login
    setTimeout(() => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', 'user@gmail.com');
      router.push('/dashboard');
    }, 800);
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Log in to your account to continue">
      <form onSubmit={handleLogin}>
        <Input 
          label="Email" 
          type="email" 
          placeholder="you@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
        
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center text-sm text-slate-600">
            <input type="checkbox" className="mr-2 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Forgot Password?
          </Link>
        </div>

        <div className="space-y-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          
          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-slate-200 w-full absolute"></div>
            <span className="bg-white px-3 text-xs uppercase text-slate-500 relative font-medium">Or continue with</span>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="flex justify-center items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.94 16.81 15.79 17.58V20.34H19.34C21.41 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.34 20.34L15.79 17.58C14.77 18.26 13.5 18.66 12 18.66C9.09 18.66 6.64 16.69 5.75 14.05H2.08V16.89C3.89 20.5 8.65 23 12 23Z" fill="#34A853"/>
              <path d="M5.75 14.05C5.52 13.37 5.39 12.7 5.39 12C5.39 11.3 5.52 10.63 5.75 9.95V7.11H2.08C1.35 8.56 0.94 10.23 0.94 12C0.94 13.77 1.35 15.44 2.08 16.89L5.75 14.05Z" fill="#FBBC05"/>
              <path d="M12 5.34C13.62 5.34 15.06 5.89 16.2 6.98L19.42 3.76C17.45 1.95 14.97 0.94 12 0.94C8.65 0.94 3.89 3.5 2.08 7.11L5.75 9.95C6.64 7.31 9.09 5.34 12 5.34Z" fill="#EA4335"/>
            </svg>
            Login with Google
          </Button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
          Sign Up
        </Link>
      </p>
    </AuthCard>
  );
}
