import React, { useState, useEffect } from 'react';
import { parseFormQuestions, matchFormFields, FORM_TEMPLATES } from '../lib/smartAutofill';
import { Modal } from './Modal';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Plus, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export function SmartAutofillModal({ isOpen, onClose, entries = [], currentSetName = 'Personal', onOpenAddEntry }) {
  const [activeTab, setActiveTab] = useState('template'); // 'template' | 'custom'
  const [selectedTemplateId, setSelectedTemplateId] = useState('job_application');
  const [customInputText, setCustomInputText] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  if (!isOpen) return null;

  const currentTemplate = FORM_TEMPLATES.find(t => t.id === selectedTemplateId) || FORM_TEMPLATES[0];

  const questionsToMatch = activeTab === 'template'
    ? currentTemplate.questions
    : parseFormQuestions(customInputText);

  const matchResult = matchFormFields(questionsToMatch, entries);

  const handleCopySingle = async (fieldLabel, value, fieldId) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(fieldId);
      setToastMessage(`Copied "${fieldLabel}" to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to copy value', err);
    }
  };

  const handleCopyAll = async () => {
    if (matchResult.matches.length === 0) return;
    const formatted = matchResult.matches
      .map(m => `${m.fieldLabel}: ${m.entryValue}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedAll(true);
      setToastMessage('Copied all mapped form fields to clipboard!');
      setTimeout(() => setCopiedAll(false), 2500);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to copy all', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Form Autofill Studio"
      subtitle={`Instant field matching from ${currentSetName} Vault`}
      maxWidth="620px"
    >
      <div>
        {/* Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          background: 'var(--surface-elevated)',
          padding: '0.3rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('template')}
            style={{
              flex: 1,
              padding: '0.55rem 0.8rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'template' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'template' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: activeTab === 'template' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            📋 Preset Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            style={{
              flex: 1,
              padding: '0.55rem 0.8rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'custom' ? 'var(--surface-card)' : 'transparent',
              color: activeTab === 'custom' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: activeTab === 'custom' ? 700 : 500,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            ✏️ Custom Form Questions
          </button>
        </div>

        {/* Template Selection */}
        {activeTab === 'template' ? (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              Select Application Type:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
              {FORM_TEMPLATES.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? '#D94A00' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(217, 74, 0, 0.08)' : 'var(--surface-elevated)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {tmpl.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {tmpl.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
              Paste Form Questions / Labels (One per line):
            </label>
            <textarea
              className="modern-input"
              style={{ height: '90px', fontSize: '0.84rem', resize: 'vertical', lineHeight: 1.5 }}
              placeholder={`Example:\nFull Name\nGitHub URL\nLinkedIn Profile\nWork Email`}
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
            />
          </div>
        )}

        {/* Matching Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.9rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Matched {matchResult.matchedCount} of {matchResult.totalCount} fields
            </span>
          </div>

          {matchResult.matchedCount > 0 && (
            <button
              type="button"
              onClick={handleCopyAll}
              className={`btn-copy-action ${copiedAll ? 'copied' : ''}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
            >
              {copiedAll ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedAll ? 'Copied All' : 'Copy All Mapped Fields'}</span>
            </button>
          )}
        </div>

        {/* Matched Field Cards */}
        {matchResult.matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.2rem' }}>
            {matchResult.matches.map((item) => {
              const isCopied = copiedId === item.fieldId;
              return (
                <div
                  key={item.fieldId}
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.8rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.fieldLabel}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: item.confidence === 'high' ? '#0D9488' : '#D97706',
                        background: item.confidence === 'high' ? 'rgba(13, 148, 136, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px'
                      }}>
                        {item.confidence === 'high' ? '🎯 Match' : '🔍 Partial'}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.78rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.entryValue}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySingle(item.fieldLabel, item.entryValue, item.fieldId)}
                    className={`btn-copy-action ${isCopied ? 'copied' : ''}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem' }}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Missing Fields Section */}
        {matchResult.missing.length > 0 && (
          <div style={{
            background: 'rgba(217, 74, 0, 0.06)',
            border: '1px dashed var(--border-strong)',
            borderRadius: '14px',
            padding: '0.9rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
              <AlertCircle size={15} color="#D94A00" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Missing Vault Items ({matchResult.missing.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {matchResult.missing.map(m => (
                <span
                  key={m.fieldId}
                  style={{
                    fontSize: '0.74rem',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    color: 'var(--text-muted)'
                  }}
                >
                  {m.fieldLabel}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAddEntry) onOpenAddEntry();
              }}
              className="btn-secondary-action"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
            >
              <Plus size={14} />
              <span>+ Add Item to QuickVault</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="toast-floating-container">
          <div className="toast-pill-box">
            <CheckCircle2 size={18} color="var(--coral-accent)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
