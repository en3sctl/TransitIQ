'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Bus,
  Calendar,
  Clock,
  Lock,
  ShieldCheck,
  LifeBuoy,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Armchair,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const tripId = searchParams.get('tripId') || '';
  const seat = searchParams.get('seat') || '';
  const price = searchParams.get('price') || '0';
  const origin = searchParams.get('origin') || 'İstanbul';
  const destination = searchParams.get('destination') || 'Ankara';
  const dateStr = searchParams.get('date') || '';
  const departureTime = searchParams.get('departureTime') || '';
  const arrivalTime = searchParams.get('arrivalTime') || '';
  const busType = searchParams.get('busType') || '';

  const [form, setForm] = useState({
    tcKimlik: '',
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [isKvkkChecked, setIsKvkkChecked] = useState(false);
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const canSubmit = isKvkkChecked && isAgreementChecked;

  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '23 Mart 2026';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/search" className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Geri Dön</span>
          </Link>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Güvenli Ödeme</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
              256-bit SSL ile Şifrelenmektedir
            </p>
          </div>
          <div>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="max-w-7xl mx-auto px-4 pt-6 flex items-center justify-center gap-4 text-xs font-bold text-slate-400 dark:text-zinc-500">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold">1</span>
          <span>Sefer Seçimi</span>
        </div>
        <div className="w-8 h-px bg-emerald-300 dark:bg-emerald-800" />
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 font-semibold">2</span>
          <span>Koltuk Seçimi</span>
        </div>
        <div className="w-8 h-px bg-emerald-300 dark:bg-emerald-800" />
        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
          <span className="w-5 h-5 rounded-full flex items-center justify-center border border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 font-semibold">3</span>
          <span>Ödeme</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Side — Forms (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section A: Yolcu Bilgileri */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Yolcu Bilgileri</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Bilet için gerekli kişisel bilgileriniz</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* TC Kimlik */}
              <div className="space-y-2">
                <Label htmlFor="tcKimlik" className="text-sm font-bold text-slate-700 dark:text-zinc-300">T.C. Kimlik No</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <Input
                    id="tcKimlik"
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="12345678901"
                    value={form.tcKimlik}
                    onChange={(e) => handleChange('tcKimlik', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Ad + Soyad row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ad" className="text-sm font-bold text-slate-700 dark:text-zinc-300">Ad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="ad"
                      type="text"
                      placeholder="Adınız"
                      value={form.ad}
                      onChange={(e) => handleChange('ad', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soyad" className="text-sm font-bold text-slate-700 dark:text-zinc-300">Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="soyad"
                      type="text"
                      placeholder="Soyadınız"
                      value={form.soyad}
                      onChange={(e) => handleChange('soyad', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email + Telefon row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-zinc-300">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefon" className="text-sm font-bold text-slate-700 dark:text-zinc-300">Cep Telefonu</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <Input
                      id="telefon"
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={form.telefon}
                      onChange={(e) => handleChange('telefon', e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Ödeme Bilgileri (Iyzico Placeholder) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Ödeme Bilgileri</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Güvenli ödeme altyapısı Iyzico tarafından sağlanmaktadır</p>
              </div>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[200px] bg-slate-50/50 dark:bg-zinc-800/20">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950/30 dark:to-emerald-950/30">
                  <CreditCard className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-700 dark:text-zinc-200">Iyzico Güvenli Ödeme Formu Buraya Gelecek</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1">Kredi kartı / Banka kartı ile güvenli ödeme</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400">VISA</div>
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400">Mastercard</div>
                  <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400">Troy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Agreement Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="kvkk"
                checked={isKvkkChecked}
                onCheckedChange={(checked) => setIsKvkkChecked(checked === true)}
                className="mt-0.5 border-slate-300 dark:border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <Label htmlFor="kvkk" className="text-sm font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed cursor-pointer">
                <Link href="/kvkk" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">KVKK Aydınlatma Metni</Link>'ni okudum, anladım ve kişisel verilerimin işlenmesine açık rıza veriyorum.
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="agreement"
                checked={isAgreementChecked}
                onCheckedChange={(checked) => setIsAgreementChecked(checked === true)}
                className="mt-0.5 border-slate-300 dark:border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <Label htmlFor="agreement" className="text-sm font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed cursor-pointer">
                <Link href="/agreements" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Mesafeli Satış Sözleşmesi</Link> ve <Link href="/agreements" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Ön Bilgilendirme Formu</Link>'nu okudum ve onaylıyorum.
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            disabled={!canSubmit}
            className={`w-full rounded-2xl py-7 font-bold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              canSubmit
                ? 'bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 hover:shadow-xl cursor-pointer'
                : 'bg-slate-300 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Lock className="w-5 h-5" />
            Güvenli Ödeme Yap
          </Button>
        </div>

        {/* Right Side — Order Summary (1 col) */}
        <div className="lg:col-span-1 space-y-5">

          {/* Sipariş Özeti Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-lg overflow-hidden transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sipariş Özeti</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Route */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Güzergah</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{origin} → {destination}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Tarih</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formattedDate}</p>
                </div>
              </div>

              {/* Departure / Arrival */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Kalkış / Varış</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{departureTime} — {arrivalTime}</p>
                </div>
              </div>

              {/* Bus Type */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Bus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Otobüs Tipi</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{busType}</p>
                </div>
              </div>

              {/* Seat */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Koltuk Numarası</p>
                  <span className="inline-block font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg text-sm">{seat}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-200 dark:border-zinc-800" />

              {/* Total Price */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800 dark:text-white">Toplam Tutar</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">₺{price}</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Güvenli İşlem
            </h3>
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>256-bit SSL Güvenli Ödeme</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>Iyzico Güvenli Ödeme Altyapısı</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <LifeBuoy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>7/24 Müşteri Hizmetleri</span>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="flex flex-col items-center justify-center py-10 animate-in fade-in-50 duration-500">
            <Bus className="w-12 h-12 mb-3 text-slate-300 dark:text-zinc-600" />
            <p className="text-3xl font-black text-zinc-950 dark:text-zinc-100 tracking-tight">TransitIQ</p>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">İyi Yolculuklar Dileriz</p>
          </div>
        </div>
      </main>
    </div>
  );
}
