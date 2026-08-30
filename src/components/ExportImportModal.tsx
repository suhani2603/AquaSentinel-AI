import React, { useRef, useState } from 'react';
import { JournalEntry } from '../types';
import { exportEntriesAsJSON, exportEntriesAsMarkdown } from '../utils/storage';
import { 
  Download, 
  Upload, 
  FileText, 
  Database, 
  Trash2, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onImportEntries: (imported: JournalEntry[]) => void;
  onClearAll: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  entries,
  onImportEntries,
  onClearAll
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title !== undefined) {
          onImportEntries(parsed);
          setImportStatus(`Successfully restored ${parsed.length} journal entries!`);
          setErrorStatus(null);
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setErrorStatus('Invalid journal backup format. Please select a valid JSON backup file.');
        }
      } catch {
        setErrorStatus('Failed to read backup file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="export-modal-card"
        className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-stone-700" />
            <h3 id="export-modal-title" className="text-base font-bold text-stone-900 font-sans-ui">
              Backup & Archive Journal
            </h3>
          </div>
          <button
            id="export-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {importStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{importStatus}</span>
          </div>
        )}

        {errorStatus && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorStatus}</span>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Export Your Entries ({entries.length} Total)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Markdown Export */}
            <button
              id="export-markdown-btn"
              onClick={() => exportEntriesAsMarkdown(entries)}
              className="p-4 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl flex flex-col items-start gap-2 transition-all cursor-pointer group"
            >
              <div className="p-2 bg-amber-100 rounded-lg text-amber-800 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">Markdown Archive</p>
                <p className="text-xs text-stone-500">Human-readable .md file with all memories & tags</p>
              </div>
            </button>

            {/* JSON Export */}
            <button
              id="export-json-btn"
              onClick={() => exportEntriesAsJSON(entries)}
              className="p-4 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl flex flex-col items-start gap-2 transition-all cursor-pointer group"
            >
              <div className="p-2 bg-stone-200 rounded-lg text-stone-800 group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4 text-stone-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">JSON Full Backup</p>
                <p className="text-xs text-stone-500">Raw data backup for easy restore across devices</p>
              </div>
            </button>
          </div>
        </div>

        {/* Restore / Import */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Restore Backup
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            id="import-backup-btn"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-stone-500" />
            <span>Select JSON Backup File to Restore</span>
          </button>
        </div>

        {/* Clear Data */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600">Reset Data</p>
            <p className="text-[11px] text-stone-400">Clear all local journal entries</p>
          </div>

          <button
            id="clear-all-data-btn"
            onClick={() => {
              if (window.confirm('Warning: This will delete all entries stored locally in this browser. Do you wish to continue?')) {
                onClearAll();
                onClose();
              }
            }}
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-xl font-medium transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

      </div>
    </div>
  );
};
