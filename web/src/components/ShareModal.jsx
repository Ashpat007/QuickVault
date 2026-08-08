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
          dark: '#0F172A',
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
    <div className="modal-overlay-blur" onClick={onClose}>
      <div 
        className="modal-dialog-box" 
        style={{ maxWidth: '440px', borderRadius: '22px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.2rem 1.6rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#FF5900',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                QR & Share Details
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>
                {set?.name || 'Personal'} Public Contact Card
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-action-button"
            style={{ padding: '0.4rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.4rem 1.6rem', textAlign: 'center' }}>
          {set?.is_public ? (
            <div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Anyone with this link or QR code can view and copy your <strong>{set.name}</strong> vault items without signing in.
              </p>

              {/* QR Image Card */}
              <div style={{
                background: '#FFFFFF',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                display: 'inline-block',
                marginBottom: '1.25rem'
              }}>
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QuickVault Share QR Code" 
                    style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px' }} 
                  />
                ) : (
                  <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                    Generating QR...
                  </div>
                )}
              </div>

              {/* URL Copy Input Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.45rem 0.65rem 0.45rem 0.85rem',
                marginBottom: '1.25rem'
              }}>
                <Globe size={15} color="var(--coral-accent)" style={{ flexShrink: 0 }} />
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
                    color: 'var(--text-main)',
                    minWidth: 0
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`btn-copy-action ${copiedLink ? 'copied' : ''}`}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="btn-primary-action"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.88rem' }}
                >
                  <Download size={16} />
                  <span>Download QR Code (.PNG)</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleToggle}
                  className="btn-secondary-action"
                  style={{ 
                    width: '100%', 
                    padding: '0.68rem', 
                    fontSize: '0.84rem',
                    color: '#EB3B5A',
                    borderColor: 'var(--border-subtle)'
                  }}
                  title="Revoke Public Sharing"
                >
                  <ShieldOff size={15} />
                  <span>Revoke Public Access</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '0.5rem 0' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.4rem', lineHeight: 1.55 }}>
                Making your <strong>{set?.name || 'Personal'}</strong> profile shareable generates a unique public URL and downloadable QR code so you can use it as your digital business card.
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={handleToggle}
                className="btn-primary-action"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.92rem' }}
              >
                <Globe size={16} />
                <span>{loading ? 'Enabling...' : 'Enable Share Mode'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
