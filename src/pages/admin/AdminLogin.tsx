import { useState, useEffect } from 'react';
import { Building2, Lock, Mail, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/Primitives';

interface AdminLoginProps {
  onBack: () => void;
}

export function AdminLogin({ onBack }: AdminLoginProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { toast('error', 'Please enter email and password.'); return; }
    if (mode === 'signup' && !fullName) { toast('error', 'Please enter your full name.'); return; }

    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) toast('error', error);
      else toast('success', 'Signed in successfully.');
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) toast('error', error);
      else toast('success', 'Account created. You are now signed in.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to website
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gold-600">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-ink-900">DEESHADES Admin</h1>
            <p className="mt-1 text-sm text-ink-500">
              {mode === 'login' ? 'Sign in to manage your dashboard' : 'Create an admin account'}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label-text">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-ink-300" />
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-field pl-10" placeholder="Your full name" />
                </div>
              </div>
            )}
            <div>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-ink-300" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input-field pl-10" placeholder="admin@deeshades.com" />
              </div>
            </div>
            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-ink-300" />
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="input-field pl-10" placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
              {loading ? <LoadingSpinner size="sm" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-gold-600 hover:underline"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
