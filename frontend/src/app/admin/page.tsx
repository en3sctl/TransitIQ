"use client";

import { useEffect, useState } from "react";
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
import { GlobalSearch } from "@/components/admin/global-search";
import { PlatformOverviewPanel } from "@/components/admin/platform-overview-panel";
import { PlatformApprovalsPanel } from "@/components/admin/platform-approvals-panel";
import { PlatformLookupPanel } from "@/components/admin/platform-lookup-panel";
import { PlatformAuditPanel } from "@/components/admin/platform-audit-panel";
import { PlatformAnnouncementsPanel } from "@/components/admin/platform-announcements-panel";
import { PlatformUsersPanel } from "@/components/admin/platform-users-panel";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { PlatformSettingsPanel } from "@/components/admin/platform-settings-panel";
import { PlatformKvkkPanel } from "@/components/admin/platform-kvkk-panel";
import { PlatformHealthPanel } from "@/components/admin/platform-health-panel";
import { Security2FAPanel } from "@/components/admin/security-2fa-panel";
import { SecuritySessionsPanel } from "@/components/admin/security-sessions-panel";
import { PlatformPlansPanel } from "@/components/admin/platform-plans-panel";
import { PlatformInvoicesPanel } from "@/components/admin/platform-invoices-panel";
import { TenantApiKeysPanel, PlatformRiskPanel, PlatformFlagsPanel, PlatformEmailTemplatesPanel, PlatformIncidentsPanel, PlatformTicketsPanel } from "@/components/admin/platform-devops-panels";
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
  Search as SearchIcon,
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
  const [searchOpen, setSearchOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    toast.success('Yenilendi');
  };

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      <ImpersonationBanner />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <AnnouncementBanner audience="COMPANY_ADMINS" />
        {/* Top Navbar */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-10 sticky top-0 z-20 transition-colors duration-500 gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-zinc-400 text-sm font-bold flex items-center gap-2">
               Panel <ChevronRight size={14} />
               <span className="text-zinc-900 dark:text-zinc-100 capitalize">{activeTab}</span>
            </span>
          </div>

          {/* Global search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-xl hidden md:flex items-center gap-3 px-4 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-zinc-800/50 transition-all group"
          >
            <SearchIcon className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 flex-1 text-left truncate">
              PNR, plaka, şehir, sürücü, şikayet... her şeyi ara
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-400 bg-white dark:bg-zinc-950">
              Ctrl K
            </kbd>
          </button>

          <div className="flex items-center gap-2 shrink-0">
             <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400"
                aria-label="Ara"
              >
                <SearchIcon className="w-4 h-4" />
             </button>
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

        <GlobalSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={(tab) => setActiveTab(tab)}
        />

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
                 activeTab === 'platform-overview' ? 'Platform · Genel Bakış' :
                 activeTab === 'platform-approvals' ? 'Platform · Onay Kuyruğu' :
                 activeTab === 'platform-lookup' ? 'Platform · Bilet Arama (Destek)' :
                 activeTab === 'platform-audit' ? 'Platform · Denetim Logu' :
                 activeTab === 'platform-announcements' ? 'Platform · Duyurular' :
                 activeTab === 'platform-users' ? 'Platform · Kullanıcılar' :
                 activeTab === 'platform-settings' ? 'Platform · Ayarlar' :
                 activeTab === 'platform-kvkk' ? 'Platform · KVKK Talepleri' :
                 activeTab === 'platform-health' ? 'Platform · Sistem Sağlığı' :
                 activeTab === 'security' ? 'Güvenlik · 2FA & Oturumlar' :
                 activeTab === 'api-keys' ? 'API Anahtarları' :
                 activeTab === 'platform-plans' ? 'Platform · Planlar' :
                 activeTab === 'platform-invoices' ? 'Platform · Faturalar' :
                 activeTab === 'platform-risk' ? 'Platform · Risk Skorları' :
                 activeTab === 'platform-flags' ? 'Platform · Özellik Bayrakları' :
                 activeTab === 'platform-email-templates' ? 'Platform · E-posta Şablonları' :
                 activeTab === 'platform-incidents' ? 'Platform · Vaka Kayıtları' :
                 activeTab === 'platform-tickets' ? 'Platform · Destek Talepleri' :
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
                 activeTab === 'platform-overview' ? 'GMV, platform geliri, büyüme trendi, leaderboard.' :
                 activeTab === 'platform-approvals' ? 'Yeni firma başvurularını incele ve onayla.' :
                 activeTab === 'platform-lookup' ? 'Tüm firmalar içinde PNR / e-posta / telefon ile bilet ara — destek aracı.' :
                 activeTab === 'platform-audit' ? 'Cross-tenant denetim logu. Kim ne yaptı, ne zaman.' :
                 activeTab === 'platform-announcements' ? 'Platform geneline duyuru yayınla.' :
                 activeTab === 'platform-users' ? 'Tüm kullanıcılar: askıya al, parola sıfırla, arama.' :
                 activeTab === 'platform-settings' ? 'Komisyon, bakım modu, min/max fiyat, oturum süresi gibi global ayarlar.' :
                 activeTab === 'platform-kvkk' ? 'KVKK veri silme / indirme / düzeltme talepleri — 30 gün içinde cevap şart.' :
                 activeTab === 'platform-health' ? 'DB, e-posta, ödeme servisi ve iş metriklerinin canlı durumu.' :
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
                <TabsContent value="platform-overview"><PlatformOverviewPanel onNavigate={setActiveTab} /></TabsContent>
                <TabsContent value="platform-approvals"><PlatformApprovalsPanel /></TabsContent>
                <TabsContent value="platform-lookup"><PlatformLookupPanel /></TabsContent>
                <TabsContent value="platform-audit"><PlatformAuditPanel /></TabsContent>
                <TabsContent value="platform-announcements"><PlatformAnnouncementsPanel /></TabsContent>
                <TabsContent value="platform-users"><PlatformUsersPanel /></TabsContent>
                <TabsContent value="platform-settings"><PlatformSettingsPanel /></TabsContent>
                <TabsContent value="platform-kvkk"><PlatformKvkkPanel /></TabsContent>
                <TabsContent value="platform-health"><PlatformHealthPanel /></TabsContent>
                <TabsContent value="security"><div className="space-y-6"><Security2FAPanel /><SecuritySessionsPanel /></div></TabsContent>
                <TabsContent value="api-keys"><TenantApiKeysPanel /></TabsContent>
                <TabsContent value="platform-plans"><PlatformPlansPanel /></TabsContent>
                <TabsContent value="platform-invoices"><PlatformInvoicesPanel /></TabsContent>
                <TabsContent value="platform-risk"><PlatformRiskPanel /></TabsContent>
                <TabsContent value="platform-flags"><PlatformFlagsPanel /></TabsContent>
                <TabsContent value="platform-email-templates"><PlatformEmailTemplatesPanel /></TabsContent>
                <TabsContent value="platform-incidents"><PlatformIncidentsPanel /></TabsContent>
                <TabsContent value="platform-tickets"><PlatformTicketsPanel /></TabsContent>
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



