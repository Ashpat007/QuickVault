import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Download, Upload, FileJson, FileSpreadsheet, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export function BackupModal({ isOpen, onClose, userId, onBackupRestored }) {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

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

  if (!isOpen) return null;

  const handleExportJson = async () => {
    try {
      setIsProcessing(true);
      const jsonStr = await supabase.backup.exportVaultToJson(userId);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `quickvault-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('🎉 JSON Backup downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to export JSON', err);
      setStatusMessage('❌ Failed to export JSON backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsProcessing(true);
      const csvStr = await supabase.backup.exportVaultToCsv(userId);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `quickvault-export-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage('🎉 CSV File downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to export CSV', err);
      setStatusMessage('❌ Failed to export CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!fileContent || !selectedFile) return;

    try {
      setIsProcessing(true);
      let result;
      if (selectedFile.name.endsWith('.json')) {
        result = await supabase.backup.importVaultFromJson(userId, fileContent);
      } else {
        result = await supabase.backup.importVaultFromCsv(userId, fileContent);
      }

      setStatusMessage(`🎉 Successfully restored ${result.importedCount} vault items!`);
      if (onBackupRestored) {
        onBackupRestored();
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to import backup', err);
      setStatusMessage(`❌ Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay-blur" onClick={onClose}>
      <div 
        className="modal-dialog-box" 
        style={{ maxWidth: '480px', borderRadius: '22px' }}
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
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                Vault Backup & Restore
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 500 }}>
                1-Click JSON & CSV Data Portability
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

        {/* Tab Bar */}
        <div style={{ padding: '0.9rem 1.6rem 0.2rem' }}>
          <div className="auth-tab-bar">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              Export Backup
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              Import / Restore
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.2rem 1.6rem 1.6rem' }}>
          {statusMessage && (
            <div style={{
              background: statusMessage.includes('🎉') ? 'var(--surface-elevated)' : '#FFF5F5',
              border: `1px solid ${statusMessage.includes('🎉') ? 'var(--coral-accent)' : '#FEB2B2'}`,
              borderRadius: '12px',
              padding: '0.65rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: statusMessage.includes('🎉') ? 'var(--coral-text)' : '#C53030',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              {statusMessage.includes('🎉') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage}</span>
            </div>
          )}

          {activeTab === 'export' ? (
            <div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Download a clean, non-lossy backup of all your profiles (`Personal`, `College`, `Work`), entries, notes, and types for safekeeping.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExportJson}
                  className="btn-primary-action"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.88rem' }}
                >
                  <FileJson size={16} />
                  <span>Download .JSON Backup (Recommended)</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExportCsv}
                  className="btn-secondary-action"
                  style={{ width: '100%', padding: '0.72rem', fontSize: '0.85rem' }}
                >
                  <FileSpreadsheet size={16} color="var(--coral-accent)" />
                  <span>Export Spreadsheet (.CSV)</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleImportSubmit}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Upload a previously exported <code>.json</code> or <code>.csv</code> file to restore and merge your items into this vault.
              </p>

              <div style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: '14px',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                background: 'var(--surface-elevated)',
                cursor: 'pointer',
                marginBottom: '1.25rem',
                transition: 'all 0.15s ease'
              }}>
                <input
                  type="file"
                  id="backupFileInput"
                  accept=".json,.csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="backupFileInput" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <Upload size={24} color="var(--coral-accent)" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedFile ? selectedFile.name : 'Click to select .JSON or .CSV file'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
                    {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB ready to import` : 'Supports standard QuickVault backups'}
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary-action"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isProcessing}
                  className="btn-primary-action"
                >
                  <Upload size={15} />
                  <span>{isProcessing ? 'Importing...' : 'Restore & Merge'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
