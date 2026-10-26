import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import AgoraLogo from '@/components/navigation/AgoraLogo';

interface AuthViewProps {
  initialMode?: 'LOGIN' | 'SIGNUP' | 'FORGOT';
  onBackToLanding?: () => void;
}

export default function AuthView({ initialMode = 'LOGIN', onBackToLanding }: AuthViewProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || (!password.trim() && mode !== 'FORGOT')) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (mode === 'SIGNUP' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'LOGIN') {
        const res = await signIn(email, password);
        if (res.error) setErrorMsg(res.error);
      } else if (mode === 'SIGNUP') {
        const res = await signUp(email, password);
        if (res.error) setErrorMsg(res.error);
        else setSuccessMsg('Account created successfully!');
      } else if (mode === 'FORGOT') {
        const res = await resetPassword(email);
        if (res.error) setErrorMsg(res.error);
        else setSuccessMsg('Password reset instructions sent to your email.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication error';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-agora-bg text-agora-ink flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md ledger-card p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in zoom-in-95 duration-200 relative">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="absolute left-6 top-6 text-xs text-agora-ink-muted hover:text-agora-ink flex items-center gap-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing</span>
          </button>
        )}

        {/* Header Logo */}
        <div className="text-center space-y-2 flex flex-col items-center pt-2">
          <AgoraLogo size="lg" />
          <p className="text-xs text-agora-ink-muted font-medium mt-1">
            Digital Ledger for Merchants
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-agora-bg p-1 rounded-2xl border border-agora-border text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'LOGIN'
                ? 'bg-agora-terracotta text-agora-card shadow-sm font-serif font-bold'
                : 'text-agora-ink-muted hover:text-agora-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGNUP');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'SIGNUP'
                ? 'bg-agora-terracotta text-agora-card shadow-sm font-serif font-bold'
                : 'text-agora-ink-muted hover:text-agora-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3 bg-agora-brick-light border border-agora-brick-border rounded-2xl text-xs text-agora-brick font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-agora-brick shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-agora-sage-light border border-agora-sage-border rounded-2xl text-xs text-agora-sage font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-agora-sage shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-ink">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-agora-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
                className="w-full bg-agora-bg border border-agora-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
              />
            </div>
          </div>

          {mode !== 'FORGOT' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-agora-ink">Password</label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => setMode('FORGOT')}
                    className="text-xs text-agora-terracotta hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-agora-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-agora-bg border border-agora-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
                />
              </div>
            </div>
          )}

          {mode === 'SIGNUP' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-agora-ink">Confirm Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-agora-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-agora-bg border border-agora-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <span>
              {isSubmitting
                ? 'Processing...'
                : mode === 'LOGIN'
                  ? 'Sign In'
                  : mode === 'SIGNUP'
                    ? 'Create Account'
                    : 'Send Reset Link'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode === 'FORGOT' && (
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className="w-full text-xs text-agora-ink-muted hover:text-agora-ink text-center block font-semibold"
          >
            Back to Sign In
          </button>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-agora-border text-center flex items-center justify-center gap-1.5 text-[11px] text-agora-ink-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-agora-terracotta" />
          <span>Protected & Encrypted</span>
        </div>
      </div>
    </div>
  );
}
