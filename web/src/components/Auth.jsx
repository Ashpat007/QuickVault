import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { checkRateLimit, resetRateLimit } from '../lib/rateLimiter';
import { KeyRound, Mail, Lock, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side Rate Limit check (P1 Requirement)
    const actionKey = isForgotPassword ? 'auth:reset' : isSignUp ? 'auth:signup' : 'auth:signin';
    const rateCheck = checkRateLimit(actionKey, { maxAttempts: 5, windowMs: 60000, cooldownMs: 30000 });

    if (!rateCheck.allowed) {
      setCooldownSec(rateCheck.retryAfterSec);
      setErrorMessage(`⛔ Too many attempts. Please wait ${rateCheck.retryAfterSec} seconds before trying again.`);
      const timer = setInterval(() => {
        setCooldownSec((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorMessage('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        resetRateLimit(actionKey);
        setSuccessMessage('Password recovery link sent! Check your inbox (or spam) to set a new password.');
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) throw error;
        resetRateLimit(actionKey);
        if (data?.session) {
          onAuthSuccess(data.session);
        } else {
          setSuccessMessage('Account created! A confirmation link has been sent to your email.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        resetRateLimit(actionKey);
        if (data?.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card-box">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="auth-brand-badge">
            <KeyRound size={26} />
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create QuickVault' : 'Welcome to QuickVault'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isForgotPassword 
              ? 'Enter your email to receive a secure password recovery link'
              : isSignUp 
                ? 'Get your 1-tap quick copy link vault in 30 seconds' 
                : '1-tap copy your links, handles, emails, and snippets'}
          </p>
        </div>

        {/* Tab Switcher */}
        {!isForgotPassword && (
          <div className="auth-tab-bar">
            <button
              type="button"
              className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(false); setErrorMessage(''); setSuccessMessage(''); }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(true); setErrorMessage(''); setSuccessMessage(''); }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Alerts */}
        {successMessage && (
          <div style={{
            background: 'var(--surface-elevated)',
            border: '1.5px solid var(--coral-accent)',
            color: 'var(--coral-text)',
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            fontSize: '0.84rem',
            fontWeight: 700,
            marginBottom: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} color="var(--coral-accent)" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: '#FFEBEB',
            color: '#D63031',
            border: '1px solid #FFD2D2',
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            fontSize: '0.84rem',
            fontWeight: 600,
            marginBottom: '1.15rem',
            lineHeight: 1.45,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {cooldownSec > 0 && <AlertTriangle size={18} color="#D63031" style={{ flexShrink: 0 }} />}
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} 
              />
              <input
                type="email"
                required
                className="modern-input"
                style={{ paddingLeft: '2.6rem' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          {!isForgotPassword && (
            <div style={{ marginBottom: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setErrorMessage(''); setSuccessMessage(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--coral-accent)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={18} 
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} 
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="modern-input"
                  style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-light)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Password is visible (click to hide)' : 'Password is hidden (click to show)'}
                >
                  {showPassword ? <Eye size={18} color="var(--coral-accent)" /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || cooldownSec > 0}
            className="btn-primary-action"
            style={{ width: '100%', padding: '0.82rem', fontSize: '0.95rem', justifyContent: 'center' }}
          >
            <span>
              {cooldownSec > 0 
                ? `Please wait (${cooldownSec}s)` 
                : loading 
                  ? 'Processing...' 
                  : isForgotPassword 
                    ? 'Send Recovery Link' 
                    : isSignUp 
                      ? 'Create Account' 
                      : 'Log In to QuickVault'}
            </span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Forgot Password Back Button */}
        {isForgotPassword && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => { setIsForgotPassword(false); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← Back to Login
            </button>
          </div>
        )}

        {/* Security Note Footer */}
        <div className="auth-security-notice">
          <ShieldCheck size={14} color="#20BF6B" />
          <span>QuickVault is designed for recurring links, handles, and snippets.</span>
        </div>
      </div>
    </div>
  );
}
