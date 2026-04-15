"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Plus, Mail, Phone, Loader2, Trash2, Edit2, X, Eye, EyeOff, Bus, Calendar, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Driver {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
  _count?: { driverTrips: number };
}

const initialForm = { name: '', email: '', password: '', phoneNumber: '' };

export function AdminDriversPanel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm] = useState(initialForm);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/users/drivers');
      setDrivers(res.data);
    } catch {
      toast.error('Şoförler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  function openEdit(d: Driver) {
    setEditTarget(d);
    setForm({ name: d.name, email: d.email, phoneNumber: d.phoneNumber || '', password: '' });
    setFormOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        const payload: Record<string, string> = {};
        if (form.name !== editTarget.name) payload.name = form.name;
        if (form.email !== editTarget.email) payload.email = form.email;
        if (form.phoneNumber !== (editTarget.phoneNumber || '')) payload.phoneNumber = form.phoneNumber;
        if (form.password) payload.password = form.password;

        await api.patch(`/users/drivers/${editTarget.id}`, payload);
        toast.success('Şoför bilgileri güncellendi');
      } else {
        if (form.password.length < 6) {
          toast.error('Şifre en az 6 karakter olmalı');
          setSubmitting(false);
          return;
        }
        const payload: Record<string, string> = {
          name: form.name,
          email: form.email.toLowerCase(),
          password: form.password,
        };
        if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim();
        await api.post('/users/drivers', payload);
        toast.success('Şoför oluşturuldu');
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'İşlem başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(d: Driver) {
    if (!confirm(`${d.name} silinecek. Emin misin?`)) return;
    try {
      await api.delete(`/users/drivers/${d.id}`);
      toast.success('Şoför silindi');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Silme başarısız');
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Şoförler</h2>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">{drivers.length} kayıtlı şoför</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Şoför Ekle
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}
        </div>
      ) : drivers.length === 0 ? (
        <div className="p-12 text-center">
          <User className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 mb-1">Henüz şoför yok</p>
          <p className="text-xs text-slate-400">İlk şoförünü ekleyerek başla</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {drivers.map((d) => (
            <div key={d.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                {d.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{d.name}</p>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {d.email}</span>
                  {d.phoneNumber && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {d.phoneNumber}</span>}
                  {typeof d._count?.driverTrips === 'number' && (
                    <span className="inline-flex items-center gap-1"><Bus className="w-3 h-3" /> {d._count.driverTrips} sefer</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(d)}
                  aria-label="Düzenle"
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => remove(d)}
                  aria-label="Sil"
                  className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !submitting && setFormOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={submit}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              {!submitting && (
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  aria-label="Kapat"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="p-7">
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white mb-1">
                  {editTarget ? 'Şoför Düzenle' : 'Yeni Şoför'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
                  {editTarget ? 'Bilgileri güncelle. Şifre boş bırakılırsa değişmez.' : 'Hesap bilgilerini gir. Şoför bu email+şifre ile giriş yapacak.'}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Ad Soyad</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">E-posta</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">
                      Şifre {editTarget && <span className="text-slate-400 normal-case tracking-normal ml-1">(değiştirmek istemezsen boş bırak)</span>}
                    </label>
                    <div className="relative">
                      <input
                        required={!editTarget}
                        type={showPwd ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        minLength={editTarget ? undefined : 6}
                        placeholder={editTarget ? '••••••••' : 'En az 6 karakter'}
                        className="w-full px-4 py-2.5 pr-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        aria-label={showPwd ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Telefon (isteğe bağlı)</label>
                    <input
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {editTarget ? 'Kaydet' : 'Oluştur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    disabled={submitting}
                    className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
