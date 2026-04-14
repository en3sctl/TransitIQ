"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import { Loader2, User, LogOut, ArrowLeft, Mail, Phone, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Ticket, Calendar, Save } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import api from "@/lib/api";

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  memberSince: string;
  stats: { totalBookings: number; activeBookings: number; pastBookings: number };
}

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/hesap/giris');
      return;
    }
    if (user.role !== 'PASSENGER') {
      router.push('/');
      return;
    }

    (async () => {
      try {
        const res = await api.get('/auth/customer/profile');
        setProfile(res.data);
        setProfileForm({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          phone: res.data.phone || '',
        });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const payload: Record<string, string> = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
      };
      const cleanPhone = profileForm.phone.replace(/\s/g, '');
      if (cleanPhone) payload.phone = cleanPhone;
      else payload.phone = '';

      await api.patch('/auth/customer/profile', payload);
      setProfileMsg({ type: 'success', text: 'Profil bilgilerin güncellendi.' });

      // Update local user state via re-fetch
      const res = await api.get('/auth/customer/profile');
      setProfile(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Güncelleme başarısız.';
      setProfileMsg({ type: 'error', text: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwMsg({ type: 'error', text: 'Yeni şifre tekrarı eşleşmiyor' });
      return;
    }

    setPwSaving(true);
    try {
      await api.post('/auth/customer/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Şifren başarıyla güncellendi.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Şifre güncellenemedi.';
      setPwMsg({ type: 'error', text: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setPwSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Profil yüklenemedi.</p>
      </div>
    );
  }

  const memberSinceDate = new Date(profile.memberSince);
  const memberSinceText = `${memberSinceDate.getDate()} ${MONTHS_TR[memberSinceDate.getMonth()]} ${memberSinceDate.getFullYear()}`;

  const initials = (profileForm.firstName[0] || '') + (profileForm.lastName[0] || '');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logoo.png" alt="TransitIQ" width={160} height={87} priority className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/hesap/biletlerim"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Ticket className="w-4 h-4" /> Biletlerim
            </Link>
            <ModeToggle />
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Back Link */}
        <Link
          href="/hesap/biletlerim"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Biletlerime Dön
        </Link>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 dark:from-indigo-800 dark:via-indigo-900 dark:to-purple-900 rounded-3xl p-8 md:p-10 mb-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-3xl font-black tracking-tight shadow-lg">
              {initials.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1">
                {profileForm.firstName} {profileForm.lastName}
              </h1>
              <p className="text-indigo-100 text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" /> {profile.email}
              </p>
              <p className="text-indigo-200 text-xs font-semibold mt-2 flex items-center gap-2 opacity-80">
                <Calendar className="w-3.5 h-3.5" /> Üyelik: {memberSinceText}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4 md:min-w-[300px]">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl md:text-3xl font-black">{profile.stats.totalBookings}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mt-1">Toplam</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl md:text-3xl font-black">{profile.stats.activeBookings}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mt-1">Aktif</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl md:text-3xl font-black">{profile.stats.pastBookings}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mt-1">Geçmiş</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">Kişisel Bilgiler</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Bu bilgiler bilet alımında otomatik kullanılır.</p>
              </div>
            </div>

            {profileMsg && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Ad</label>
                  <input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Soyad</label>
                  <input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={profile.email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-500 font-semibold cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">E-posta adresi değiştirilemez</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-black dark:hover:bg-white text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {profileSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </motion.div>

          {/* Password Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">Şifre Değiştir</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Hesap güvenliğin için düzenli olarak güncelle.</p>
              </div>
            </div>

            {pwMsg && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                pwMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
              }`}>
                {pwMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={changePw} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Mevcut Şifre</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600">
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Yeni Şifre</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600">
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">Yeni Şifre (Tekrar)</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.confirmNewPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmNewPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={pwSaving}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {pwSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
