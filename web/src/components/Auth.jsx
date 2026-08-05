import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { KeyRound, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.session) {
          onAuthSuccess(data.session);
        } else {
          setErrorMessage('Account created! Please check your email or log in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
    <div style={{ maxWidth: '440px', margin: '1rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem 2.25rem' }}>
        
        {/* Auth Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div 
            className="brand-icon-box" 
            style={{ width: '56px', height: '56px', margin: '0 auto 1.1rem', borderRadius: '18px' }}
          >
            <KeyRound size={28} />
          </div>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create your Vault' : 'Welcome to QuickVault'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.4rem', fontWeight: 500 }}>
            {isSignUp 
              ? 'Save & copy your links, handles and snippets instantly.' 
              : 'Sign in to access your personal quick-copy vault.'}
          </p>
        </div>

        {/* Tab Switcher Bar */}
        <div className="auth-tab-bar">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
            className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
            className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
          >
            Sign Up
          </button>
        </div>

        {supabase.isLocalDemo && (
          <div style={{ 
            background: 'var(--coral-light)', 
            border: '1px solid var(--border-strong)', 
            borderRadius: '14px', 
            padding: '0.85rem 1rem', 
            fontSize: '0.84rem', 
            color: 'var(--coral-text)',
            fontWeight: 600,
            marginBottom: '1.35rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <span>Local demo mode active. Enter any email to start!</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: '#FFEBEB',
            color: '#D63031',
            border: '1px solid #FFD2D2',
            padding: '0.8rem 1rem',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '1.35rem'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
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

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              Password
            </label>
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-action"
            style={{ width: '100%', padding: '0.88rem', fontSize: '0.98rem' }}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
