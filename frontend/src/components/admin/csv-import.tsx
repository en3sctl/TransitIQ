"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export interface CSVColumnMapping {
  csvHeader: string;       // what to look for in CSV (case-insensitive)
  payloadKey: string;      // API payload key
  required?: boolean;
  transform?: (v: string) => any; // e.g. Number for numeric fields
}

interface CSVImportProps {
  title: string;
  endpoint: string;        // e.g. '/vehicles'
  columns: CSVColumnMapping[];
  sampleRow?: Record<string, string>; // for download template
  onComplete?: () => void;
}

export function CSVImport({ title, endpoint, columns, sampleRow, onComplete }: CSVImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ ok: 0, fail: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    return lines.map(line => {
      const result: string[] = [];
      let cur = '', inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQuote = !inQuote;
        else if ((c === ',' || c === ';') && !inQuote) { result.push(cur); cur = ''; }
        else cur += c;
      }
      result.push(cur);
      return result.map(s => s.trim());
    });
  }

  async function handleFile(f: File) {
    setFile(f);
    setErrors([]);
    const text = await f.text();
    // Strip BOM
    const clean = text.replace(/^\uFEFF/, '');
    const parsed = parseCSV(clean);
    if (parsed.length < 2) {
      setErrors(['CSV dosyası boş veya başlık satırı yok']);
      return;
    }
    const headers = parsed[0].map(h => h.toLowerCase().trim());
    const colMap = columns.map(c => ({
      ...c,
      csvIdx: headers.findIndex(h => h === c.csvHeader.toLowerCase()),
    }));

    const missing = colMap.filter(c => c.required && c.csvIdx === -1);
    if (missing.length > 0) {
      setErrors(missing.map(m => `Gerekli sütun eksik: ${m.csvHeader}`));
      return;
    }

    const parsedRows: any[] = [];
    const errs: string[] = [];
    parsed.slice(1).forEach((row, i) => {
      const obj: any = {};
      for (const c of colMap) {
        if (c.csvIdx === -1) continue;
        const val = row[c.csvIdx] || '';
        if (c.required && !val) {
          errs.push(`Satır ${i + 2}: ${c.csvHeader} boş`);
          return;
        }
        if (val) {
          obj[c.payloadKey] = c.transform ? c.transform(val) : val;
        }
      }
      parsedRows.push(obj);
    });

    setRows(parsedRows);
    if (errs.length > 0) setErrors(errs.slice(0, 5));
  }

  async function doImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setProgress({ ok: 0, fail: 0, total: rows.length });
    const failures: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        await api.post(endpoint, rows[i]);
        setProgress(p => ({ ...p, ok: p.ok + 1 }));
      } catch (e: any) {
        const msg = e.response?.data?.message;
        failures.push(`Satır ${i + 2}: ${Array.isArray(msg) ? msg[0] : msg || 'Hata'}`);
        setProgress(p => ({ ...p, fail: p.fail + 1 }));
      }
    }

    if (failures.length === 0) {
      toast.success(`${rows.length} kayıt yüklendi`);
      reset();
      onComplete?.();
    } else {
      toast.warning(`${progress.ok} başarılı, ${failures.length} başarısız`);
      setErrors(failures.slice(0, 10));
    }
    setImporting(false);
  }

  function reset() {
    setFile(null);
    setRows([]);
    setErrors([]);
    setProgress({ ok: 0, fail: 0, total: 0 });
    setOpen(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function downloadTemplate() {
    const headers = columns.map(c => c.csvHeader);
    const sample = sampleRow ? columns.map(c => sampleRow[c.payloadKey] || '') : [];
    const csv = [headers, ...(sample.length ? [sample] : [])].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${title.toLowerCase()}_sablon.csv`; a.click();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
        <Upload className="w-3.5 h-3.5" /> CSV Yükle
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !importing && reset()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-500" /> {title} CSV Yükleme
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Toplu kayıt ekle</p>
                </div>
                {!importing && (
                  <button onClick={reset} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
                )}
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Template download */}
                <button onClick={downloadTemplate}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                  <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Şablon İndir</p>
                    <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Doğru format için örnek CSV</p>
                  </div>
                </button>

                {/* Upload */}
                {!file ? (
                  <label className="block border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
                    <Upload className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">CSV dosyası seç veya sürükle</p>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-1">Noktalı virgül (;) veya virgül (,) ayraçlı</p>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  </label>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-[10px] font-semibold text-zinc-400">{rows.length} satır algılandı</p>
                    </div>
                    {!importing && (
                      <button onClick={reset} className="text-zinc-400 hover:text-zinc-700"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                )}

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-rose-900 dark:text-rose-300 uppercase tracking-wider mb-1.5">Hatalar</p>
                        <ul className="space-y-0.5">
                          {errors.map((e, i) => (
                            <li key={i} className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 leading-relaxed">• {e}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress */}
                {importing && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Yükleniyor...</span>
                      <span className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">{progress.ok + progress.fail} / {progress.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(progress.ok + progress.fail) / progress.total * 100}%` }} />
                    </div>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-1 flex gap-3">
                      <span className="text-emerald-600">✓ {progress.ok}</span>
                      {progress.fail > 0 && <span className="text-rose-600">✗ {progress.fail}</span>}
                    </p>
                  </div>
                )}

                {/* Column guide */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Beklenen Sütunlar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {columns.map(c => (
                      <span key={c.payloadKey} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        c.required ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {c.csvHeader}{c.required && '*'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                <button onClick={reset} disabled={importing}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50">
                  İptal
                </button>
                <button onClick={doImport} disabled={importing || rows.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {importing ? 'Yükleniyor' : `${rows.length} Kayıt Yükle`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
