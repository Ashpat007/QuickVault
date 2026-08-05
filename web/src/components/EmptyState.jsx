import React from 'react';
import { Copy, Plus, Mail, Globe } from 'lucide-react';

function GithubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function EmptyState({ onAddFirstEntry }) {
  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '260px',
        height: '260px',
        background: 'radial-gradient(circle, var(--coral-light) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div 
          className="brand-icon-box" 
          style={{ 
            width: '64px', 
            height: '64px', 
            margin: '0 auto 1.5rem', 
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(248, 125, 101, 0.4)'
          }}
        >
          <Copy size={30} color="#FFFFFF" />
        </div>

        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          Your Vault is Ready
        </h3>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          QuickVault stores your recurring links, handles, portfolio, emails, and snippets for one-tap copying on any website or app.
        </p>

        {/* Feature Type Chips Showcase */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          marginBottom: '2.25rem'
        }}>
          <div style={{
            background: 'var(--coral-light)',
            border: '1px solid var(--border-strong)',
            borderRadius: '9999px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--coral-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <GithubIcon size={14} />
            <span>GitHub Profile</span>
          </div>

          <div style={{
            background: 'var(--coral-light)',
            border: '1px solid var(--border-strong)',
            borderRadius: '9999px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--coral-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <LinkedinIcon size={14} />
            <span>LinkedIn Handle</span>
          </div>

          <div style={{
            background: 'var(--coral-light)',
            border: '1px solid var(--border-strong)',
            borderRadius: '9999px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--coral-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Mail size={14} />
            <span>Work Email</span>
          </div>

          <div style={{
            background: 'var(--coral-light)',
            border: '1px solid var(--border-strong)',
            borderRadius: '9999px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--coral-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Globe size={14} />
            <span>Portfolio URL</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddFirstEntry}
          className="btn-primary-action"
          style={{ padding: '0.9rem 1.8rem', fontSize: '1rem' }}
        >
          <Plus size={20} />
          <span>Add Your First Link or Snippet</span>
        </button>
      </div>
    </div>
  );
}
