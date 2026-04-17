"use client";

/**
 * Imperative themed dialogs — drop-in replacements for native
 * alert() / confirm() / prompt() calls. Uses a tiny pub/sub store
 * so any component can trigger a dialog without wrapping in a provider.
 *
 * Usage:
 *   import { confirmDialog, promptDialog, alertDialog } from '@/components/ui/dialogs';
 *   const ok = await confirmDialog({ title: 'Emin misin?', variant: 'danger' });
 *   const text = await promptDialog({ title: 'Not', placeholder: 'Yaz...' });
 *
 * Mount `<DialogsRoot />` once in the app root layout.
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, CheckCircle2, Info, Loader2 } from "lucide-react";

// ─── Store ────────────────────────────────────────────────────────

type DialogVariant = 'default' | 'danger' | 'warning' | 'success';
interface ConfirmOpts {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}
interface PromptOpts extends ConfirmOpts {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  type?: 'text' | 'number' | 'password' | 'textarea';
  minLength?: number;
  maxLength?: number;
  validate?: (v: string) => string | null; // return error message or null
}
interface DialogState {
  id: number;
  kind: 'confirm' | 'prompt' | 'alert';
  opts: ConfirmOpts & PromptOpts;
  resolve: (v: any) => void;
}

let nextId = 1;
const listeners = new Set<(d: DialogState | null) => void>();
let current: DialogState | null = null;

function emit() { listeners.forEach((fn) => fn(current)); }

function subscribe(fn: (d: DialogState | null) => void) {
  listeners.add(fn); fn(current);
  return () => { listeners.delete(fn); };
}

// ─── Imperative API ──────────────────────────────────────────────

export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    current = { id: nextId++, kind: 'confirm', opts, resolve };
    emit();
  });
}

export function promptDialog(opts: PromptOpts): Promise<string | null> {
  return new Promise((resolve) => {
    current = { id: nextId++, kind: 'prompt', opts, resolve };
    emit();
  });
}

export function alertDialog(opts: ConfirmOpts): Promise<void> {
  return new Promise((resolve) => {
    current = { id: nextId++, kind: 'alert', opts, resolve: () => resolve() };
    emit();
  });
}

// ─── Variant styles ──────────────────────────────────────────────

const VARIANT_META: Record<DialogVariant, { icon: any; tone: string; btn: string }> = {
  default: {
    icon: Info,
    tone: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
  },
  danger: {
    icon: AlertTriangle,
    tone: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    btn: 'bg-rose-600 hover:bg-rose-700',
  },
  warning: {
    icon: AlertTriangle,
    tone: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600',
  },
  success: {
    icon: CheckCircle2,
    tone: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
  },
};

// ─── Root component ──────────────────────────────────────────────

export function DialogsRoot() {
  const [state, setState] = useState<DialogState | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => subscribe((s) => {
    setState(s);
    setValue(s?.opts.defaultValue || '');
    setError(null);
    setSubmitting(false);
  }), []);

  useEffect(() => {
    if (state && inputRef.current) setTimeout(() => inputRef.current?.focus(), 30);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(state.kind === 'confirm' ? false : null);
      if (e.key === 'Enter' && state.kind !== 'prompt') submit();
      if (e.key === 'Enter' && state.kind === 'prompt' && state.opts.type !== 'textarea' && !e.shiftKey) {
        e.preventDefault(); submit();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, value]);

  if (!state) return null;

  const meta = VARIANT_META[state.opts.variant || 'default'];
  const Icon = meta.icon;

  function close(result: any) {
    setSubmitting(true);
    current = null;
    setTimeout(() => {
      state!.resolve(result);
      emit();
    }, 50);
  }

  function submit() {
    if (state!.kind === 'confirm') return close(true);
    if (state!.kind === 'alert') return close(undefined);
    // prompt
    const v = value.trim();
    const opts = state!.opts;
    if (opts.minLength && v.length < opts.minLength) {
      setError(`En az ${opts.minLength} karakter`); return;
    }
    if (opts.maxLength && v.length > opts.maxLength) {
      setError(`En fazla ${opts.maxLength} karakter`); return;
    }
    if (opts.validate) {
      const msg = opts.validate(v);
      if (msg) { setError(msg); return; }
    }
    close(v);
  }

  return (
    <AnimatePresence>
      <motion.div
        key={state.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => close(state.kind === 'confirm' ? false : null)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.tone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">{state.opts.title}</h3>
                {state.opts.message && (
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed whitespace-pre-wrap">{state.opts.message}</p>
                )}
              </div>
              <button onClick={() => close(state.kind === 'confirm' ? false : null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {state.kind === 'prompt' && (
              <div className="mt-4">
                {state.opts.label && (
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">{state.opts.label}</label>
                )}
                {state.opts.type === 'textarea' ? (
                  <textarea
                    ref={inputRef as any}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setError(null); }}
                    placeholder={state.opts.placeholder}
                    rows={4}
                    maxLength={state.opts.maxLength}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
                  />
                ) : (
                  <input
                    ref={inputRef as any}
                    type={state.opts.type || 'text'}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setError(null); }}
                    placeholder={state.opts.placeholder}
                    maxLength={state.opts.maxLength}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  />
                )}
                {error && <p className="text-[11px] text-rose-600 font-bold mt-1.5">{error}</p>}
              </div>
            )}
          </div>

          <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-950/50 flex items-center justify-end gap-2">
            {(state.kind === 'confirm' || state.kind === 'prompt') && (
              <button
                onClick={() => close(state.kind === 'confirm' ? false : null)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                {state.opts.cancelLabel || 'Vazgeç'}
              </button>
            )}
            <button
              onClick={submit}
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 ${meta.btn}`}
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {state.opts.confirmLabel || (state.kind === 'alert' ? 'Tamam' : state.kind === 'confirm' ? 'Devam' : 'Kaydet')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
