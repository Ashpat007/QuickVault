import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, ShieldOff, Globe, QrCode } from 'lucide-react';

export function ShareModal({ isOpen, onClose, set, onToggleShare }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open-lock');
    } else {
      document.body.classList.remove('modal-open-lock');
    }
    return () => {
      document.body.classList.remove('modal-open-lock');
    };
  }, [isOpen]);

  const shareUrl = set?.public_slug 
    ? `${window.location.origin}/share/${set.public_slug}` 
    : '';

  useEffect(() => {
    if (shareUrl && set?.is_public) {
      QRCode.toDataURL(shareUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#1F191B',
          light: '#FFFFFF'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
    } else {
      setQrDataUrl('');
    }
  }, [shareUrl, set?.is_public]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QuickVault-QR-${set.public_slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggleShare(!set?.is_public);
    } catch (err) {
      console.error('Failed to toggle share state', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-blur">
      <div className="modal-dialog-box" style={{ maxWidth: '480px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.4rem 1.75rem 1.2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--coral-light)',
              color: 'var(--coral-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={20} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              QR & Share Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-action-button"
            style={{ padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-scrollable-body" style={{ textAlign: 'center' }}>
          {set?.is_public ? (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Anyone with this link or QR code can view and copy your <strong>{set.name}</strong> vault items without signing in.
              </p>

              <div style={{
                background: '#FFFFFF',
                padding: '1.25rem',
                borderRadius: '18px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
                display: 'inline-block',
                marginBottom: '1.25rem'
              }}>
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QuickVault Share QR Code" 
                    style={{ width: '200px', height: '200px', display: 'block', borderRadius: '8px' }} 
                  />
                ) : (
                  <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                    Generating QR...
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '0.6rem 0.85rem',
                marginBottom: '1.25rem'
              }}>
                <Globe size={16} color="var(--coral-accent)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.82rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--text-main)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`btn-copy-action ${copiedLink ? 'copied' : ''}`}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="btn-primary-action"
                  style={{ width: '100%', padding: '0.82rem' }}
                >
                  <Download size={18} />
                  <span>Download QR Code (.PNG)</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleToggle}
                  style={{
                    background: '#FFEBEB',
                    color: '#EB3B5A',
                    border: '1px solid #FFC2C2',
                    padding: '0.75rem',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldOff size={16} />
                  <span>Revoke Public Access</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem 0' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Making your <strong>{set?.name || 'Personal'}</strong> set shareable generates a unique public URL and downloadable QR code so you can use it as a digital business card.
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={handleToggle}
                className="btn-primary-action"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                <Globe size={18} />
                <span>{loading ? 'Enabling...' : 'Enable Share Mode'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
