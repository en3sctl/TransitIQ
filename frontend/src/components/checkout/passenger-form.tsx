'use client';

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Armchair,
  User,
  ShieldCheck,
  Mail,
  Phone,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useBookingStore } from '@/store/useBookingStore';
import type { Passenger } from '@/types/booking';

// ---------- Single Passenger Card ----------
interface PassengerCardProps {
  passenger: Passenger;
  index: number;
  isOnly: boolean;
}

const PassengerCard = memo(function PassengerCard({
  passenger,
  index,
  isOnly,
}: PassengerCardProps) {
  const updatePassenger = useBookingStore((s) => s.updatePassenger);

  const handleChange = useCallback(
    (field: keyof Passenger, value: string) => {
      updatePassenger(passenger.seatNumber, { [field]: value });
    },
    [updatePassenger, passenger.seatNumber]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300"
    >
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isOnly ? 'Yolcu Bilgileri' : `${index + 1}. Yolcu`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              Bilet için gerekli kişisel bilgiler
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="inline-block font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg text-sm">
            {passenger.seatNumber}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-5">
        {/* TC Kimlik */}
        <div className="space-y-2">
          <Label
            htmlFor={`tc-${passenger.seatNumber}`}
            className="text-sm font-bold text-slate-700 dark:text-zinc-300"
          >
            T.C. Kimlik No
          </Label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <Input
              id={`tc-${passenger.seatNumber}`}
              type="text"
              inputMode="numeric"
              maxLength={11}
              placeholder="12345678901"
              value={passenger.tcKimlik}
              onChange={(e) =>
                handleChange('tcKimlik', e.target.value.replace(/\D/g, '').slice(0, 11))
              }
              className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Ad + Soyad row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor={`ad-${passenger.seatNumber}`}
              className="text-sm font-bold text-slate-700 dark:text-zinc-300"
            >
              Ad
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <Input
                id={`ad-${passenger.seatNumber}`}
                type="text"
                placeholder="Adınız"
                value={passenger.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor={`soyad-${passenger.seatNumber}`}
              className="text-sm font-bold text-slate-700 dark:text-zinc-300"
            >
              Soyad
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <Input
                id={`soyad-${passenger.seatNumber}`}
                type="text"
                placeholder="Soyadınız"
                value={passenger.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ---------- Contact Info Section ----------
const ContactSection = memo(function ContactSection() {
  const contactEmail = useBookingStore((s) => s.contactEmail);
  const contactPhone = useBookingStore((s) => s.contactPhone);
  const setContactEmail = useBookingStore((s) => s.setContactEmail);
  const setContactPhone = useBookingStore((s) => s.setContactPhone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden transition-all duration-300"
    >
      <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
          <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            İletişim Bilgileri
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
            Bilet ve PNR kodu bu bilgilere gönderilecektir
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="contact-email"
              className="text-sm font-bold text-slate-700 dark:text-zinc-300"
            >
              E-posta
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <Input
                id="contact-email"
                type="email"
                placeholder="ornek@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="contact-phone"
              className="text-sm font-bold text-slate-700 dark:text-zinc-300"
            >
              Cep Telefonu
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <Input
                id="contact-phone"
                type="tel"
                placeholder="05XX XXX XX XX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ---------- Main Dynamic Passenger Form ----------
export function PassengerForm() {
  const passengers = useBookingStore((s) => s.passengers);
  const selectedSeats = useBookingStore((s) => s.selectedSeats);
  const isMultiple = selectedSeats.length > 1;

  return (
    <div className="space-y-5">
      {/* Multiple passenger badge */}
      {isMultiple && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50"
        >
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
            {selectedSeats.length} yolcu için bilgi girmeniz gerekmektedir
          </span>
        </motion.div>
      )}

      {/* Passenger cards */}
      <AnimatePresence mode="popLayout">
        {passengers.map((passenger, index) => (
          <PassengerCard
            key={passenger.seatNumber}
            passenger={passenger}
            index={index}
            isOnly={!isMultiple}
          />
        ))}
      </AnimatePresence>

      {/* Contact section (shared) */}
      <ContactSection />
    </div>
  );
}
