"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/protected-route";
import Sidebar from "@/components/sidebar";
import { AdminBookingsPanel } from "@/components/admin/bookings-panel";
import { AdminDriversPanel } from "@/components/admin/drivers-panel";
import { AdminAuditLogsPanel } from "@/components/admin/audit-logs-panel";
import { VehiclesPanel } from "@/components/admin/vehicles-panel";
import { TripsPanel } from "@/components/admin/trips-panel";
import { RoutesPanel } from "@/components/admin/routes-panel";
import { StationsPanel } from "@/components/admin/stations-panel";
import { PromoPanel } from "@/components/admin/promo-panel";
import { OverviewDashboard } from "@/components/admin/overview-dashboard";
import { SystemOverview } from "@/components/admin/system-overview";
import { NotificationBell } from "@/components/admin/notification-bell";
import { FeedbackPanel } from "@/components/admin/feedback-panel";
import { WaitingListPanel } from "@/components/admin/waiting-list-panel";
import { TenantSettingsPanel } from "@/components/admin/tenant-settings-panel";
import { SuperTenantsPanel } from "@/components/admin/super-tenants-panel";
import { SettlementPanel } from "@/components/admin/settlement-panel";
import { SuperSettlementsPanel } from "@/components/admin/super-settlements-panel";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";
import {
  RefreshCw,
  ChevronRight,
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    toast.success('Yenilendi');
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-10 sticky top-0 z-20 transition-colors duration-500">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm font-bold flex items-center gap-2">
               Panel <ChevronRight size={14} /> 
               <span className="text-zinc-900 dark:text-zinc-100 capitalize">{activeTab}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
             <NotificationBell onNavigate={setActiveTab} />
             <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-zinc-500 dark:text-zinc-400"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto">
          <motion.div 
            className="p-10 max-w-7xl mx-auto w-full space-y-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            
            {/* Welcome Section */}
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
                {activeTab === 'overview' ? `Merhaba, ${user?.name.split(' ')[0]}` :
                 activeTab === 'revenue' ? 'Ciro & Analiz' :
                 activeTab === 'vehicles' ? 'Araç Filosu' :
                 activeTab === 'stations' ? 'İstasyonlar & Terminaller' :
                 activeTab === 'routes' ? 'Rota Havuzu' :
                 activeTab === 'trips' ? 'Sefer Takvimi' :
                 activeTab === 'bookings' ? 'Bilet Yönetimi' :
                 activeTab === 'drivers' ? 'Sürücü Paneli' :
                 activeTab === 'audit' ? 'Denetim Logu' :
                 activeTab === 'promo' ? 'Promo Kodları' :
                 activeTab === 'feedback' ? 'Geri Bildirim' :
                 activeTab === 'waiting-list' ? 'Bekleme Listesi' :
                 activeTab === 'tenant' ? 'Firma Ayarları' :
                 activeTab === 'super-tenants' ? 'Platform · Firmalar' :
                 activeTab === 'settlements' ? 'Hesap Özeti' :
                 activeTab === 'super-settlements' ? 'Platform · Ödeme Takibi' :
                 'Panel'}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">
                {activeTab === 'overview' ? 'Günlük operasyonel özet, uyarılar ve canlı durum.' :
                 activeTab === 'revenue' ? 'Detaylı gelir analizi, trend, saat yoğunluk haritası ve top listeler.' :
                 activeTab === 'vehicles' ? 'Filonuzdaki araçları ve bakım durumlarını yönetin.' :
                 activeTab === 'stations' ? 'Otogar ve terminal lokasyonlarınız.' :
                 activeTab === 'routes' ? 'Kalkış-varış rotalarınız ve fiyatlandırma.' :
                 activeTab === 'trips' ? 'Planlanan ve aktif seferleriniz.' :
                 activeTab === 'bookings' ? 'Bilet satışları, iptaller ve iadeler.' :
                 activeTab === 'drivers' ? 'Şoför kadronuz ve yetkileri.' :
                 activeTab === 'audit' ? 'Tüm kritik işlemlerin denetim kaydı.' :
                 activeTab === 'promo' ? 'İndirim kodları oluşturun ve yönetin.' :
                 activeTab === 'feedback' ? 'Yolcu şikayetleri ve yorumları.' :
                 activeTab === 'waiting-list' ? 'Dolu seferlere kayıt olan yolcular; koltuk boşalınca otomatik e-posta atılır.' :
                 activeTab === 'tenant' ? 'Firma profili, logo, marka, iletişim, yasal bilgiler ve ödeme yönlendirme.' :
                 activeTab === 'super-tenants' ? 'Platformdaki tüm firmaları yönet: onay, askıya alma, komisyon oranı.' :
                 activeTab === 'settlements' ? 'Ciro, platform komisyonu, net alacak ve ödeme durumu.' :
                 activeTab === 'super-settlements' ? 'Tüm firmaların brut/komisyon/net kayıtları ve ödeme işaretleme.' :
                 'Verileriniz burada.'}
              </p>
            </div>


            {/* Tabs Content */}
            <div className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                <TabsContent value="overview">
                  <SystemOverview onNavigate={setActiveTab} refreshKey={refreshKey} />
                </TabsContent>

                <TabsContent value="revenue">
                  <OverviewDashboard onNavigate={setActiveTab} />
                </TabsContent>

                <TabsContent value="vehicles"><VehiclesPanel /></TabsContent>
                <TabsContent value="stations"><StationsPanel /></TabsContent>
                <TabsContent value="routes"><RoutesPanel /></TabsContent>
                <TabsContent value="trips"><TripsPanel /></TabsContent>
                <TabsContent value="bookings" className="mt-6"><AdminBookingsPanel /></TabsContent>
                <TabsContent value="drivers" className="mt-6"><AdminDriversPanel /></TabsContent>
                <TabsContent value="audit" className="mt-6"><AdminAuditLogsPanel /></TabsContent>
                <TabsContent value="promo"><PromoPanel /></TabsContent>
                <TabsContent value="feedback"><FeedbackPanel /></TabsContent>
                <TabsContent value="waiting-list"><WaitingListPanel /></TabsContent>
                <TabsContent value="tenant"><TenantSettingsPanel /></TabsContent>
                <TabsContent value="settlements"><SettlementPanel /></TabsContent>
                <TabsContent value="super-tenants"><SuperTenantsPanel /></TabsContent>
                <TabsContent value="super-settlements"><SuperSettlementsPanel /></TabsContent>
              </Tabs>
            </div>

            {/* Footer Branding */}
            <div className="pt-20 pb-10 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 opacity-30 select-none transition-colors">
               <span className="text-2xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-100">TRANSITIQ</span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Integrated Intelligence</span>
            </div>
          </motion.div>
        </div>
      </main>

    </div>
  );
}



