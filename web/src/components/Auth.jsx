import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { KeyRound, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

export function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Trigger Password Reset Email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setSuccessMessage(`Password reset link sent to ${email}! Please check your email inbox.`);
      } else if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.session) {
          onAuthSuccess(data.session);
        } else {
          setIsSignUp(false);
          setPassword('');
          setSuccessMessage(`Account created for ${email}! Please check your inbox for the confirmation email link.`);
        }
      } else {
        // Log In
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'Invalid email or password. Note: If you just signed up, make sure to click the verification link sent to your email inbox first!';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '0.5rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem 2rem' }}>
        
        {/* Auth Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div 
            className="brand-icon-box" 
            style={{ width: '50px', height: '50px', margin: '0 auto 0.8rem', borderRadius: '16px' }}
          >
            <KeyRound size={26} />
          </div>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {isForgotPassword 
              ? 'Reset Password' 
              : isSignUp 
                ? 'Create your Vault' 
                : 'Welcome to QuickVault'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem', fontWeight: 500 }}>
            {isForgotPassword
              ? 'Enter your email to receive a password reset link.'
              : isSignUp 
                ? 'Save & copy your links, handles and snippets instantly.' 
                : 'Sign in to access your personal quick-copy vault.'}
          </p>
        </div>

        {/* Tab Switcher Bar (Hidden when in Forgot Password mode) */}
        {!isForgotPassword && (
          <div className="auth-tab-bar" style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMessage(''); setSuccessMessage(''); }}
              className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMessage(''); setSuccessMessage(''); }}
              className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
            >
              Sign Up
            </button>
          </div>
        )}

        {supabase.isLocalDemo && (
          <div style={{ 
            background: 'var(--coral-light)', 
            border: '1px solid var(--border-strong)', 
            borderRadius: '14px', 
            padding: '0.75rem 1rem', 
            fontSize: '0.82rem', 
            color: 'var(--coral-text)',
            fontWeight: 600,
            marginBottom: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={15} style={{ flexShrink: 0 }} />
            <span>Local demo mode active. Enter any email to start!</span>
          </div>
        )}

        {/* Success Alert Banner (Green) */}
        {successMessage && (
          <div style={{
            background: '#E8F8F0',
            color: '#10B981',
            border: '1px solid #A7F3D0',
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginBottom: '1.15rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            lineHeight: 1.45
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#10B981' }} />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Error Alert Banner (Red) */}
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
            lineHeight: 1.45
          }}>
            {errorMessage}
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

          {/* Password Field (Hidden in Forgot Password Mode) */}
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
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-action"
            style={{ width: '100%', padding: '0.82rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Log In')}
            <ArrowRight size={18} />
          </button>

          {/* Back to Login Button (When in Forgot Password Mode) */}
          {isForgotPassword && (
            <button
              type="button"
              onClick={() => { setIsForgotPassword(false); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                width: '100%',
                marginTop: '0.85rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Log In</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
