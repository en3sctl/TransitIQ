"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/protected-route";
import Sidebar from "@/components/sidebar";
import { NotificationBell } from "@/components/admin/notification-bell";
import { GlobalSearch } from "@/components/admin/global-search";
import { SystemOverview } from "@/components/admin/system-overview";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Loader2 } from "lucide-react";

// Panel skeleton — tab'a tıklanınca yüklenene kadar gösterilir
const PanelSkeleton = () => (
  <div className="flex items-center justify-center py-32">
    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
  </div>
);

// Lazy-loaded paneller — sadece ilgili tab seçilince yüklenir.
// named export'ları wrapping için `.then(m => ({ default: m.X }))` kullanıyoruz.
const lazyPanel = <T,>(loader: () => Promise<Record<string, T>>, key: string) =>
  dynamic(
    () => loader().then((m) => ({ default: (m as any)[key] })) as any,
    { ssr: false, loading: PanelSkeleton },
  );

const OverviewDashboard = lazyPanel(() => import("@/components/admin/overview-dashboard"), "OverviewDashboard");
const AdminBookingsPanel = lazyPanel(() => import("@/components/admin/bookings-panel"), "AdminBookingsPanel");
const AdminDriversPanel = lazyPanel(() => import("@/components/admin/drivers-panel"), "AdminDriversPanel");
const AdminAuditLogsPanel = lazyPanel(() => import("@/components/admin/audit-logs-panel"), "AdminAuditLogsPanel");
const VehiclesPanel = lazyPanel(() => import("@/components/admin/vehicles-panel"), "VehiclesPanel");
const TripsPanel = lazyPanel(() => import("@/components/admin/trips-panel"), "TripsPanel");
const RoutesPanel = lazyPanel(() => import("@/components/admin/routes-panel"), "RoutesPanel");
const StationsPanel = lazyPanel(() => import("@/components/admin/stations-panel"), "StationsPanel");
const PromoPanel = lazyPanel(() => import("@/components/admin/promo-panel"), "PromoPanel");
const FeedbackPanel = lazyPanel(() => import("@/components/admin/feedback-panel"), "FeedbackPanel");
const WaitingListPanel = lazyPanel(() => import("@/components/admin/waiting-list-panel"), "WaitingListPanel");
const TenantSettingsPanel = lazyPanel(() => import("@/components/admin/tenant-settings-panel"), "TenantSettingsPanel");
const SuperTenantsPanel = lazyPanel(() => import("@/components/admin/super-tenants-panel"), "SuperTenantsPanel");
const SettlementPanel = lazyPanel(() => import("@/components/admin/settlement-panel"), "SettlementPanel");
const SuperSettlementsPanel = lazyPanel(() => import("@/components/admin/super-settlements-panel"), "SuperSettlementsPanel");
const PlatformOverviewPanel = lazyPanel(() => import("@/components/admin/platform-overview-panel"), "PlatformOverviewPanel");
const PlatformApprovalsPanel = lazyPanel(() => import("@/components/admin/platform-approvals-panel"), "PlatformApprovalsPanel");
const PlatformLookupPanel = lazyPanel(() => import("@/components/admin/platform-lookup-panel"), "PlatformLookupPanel");
const PlatformAuditPanel = lazyPanel(() => import("@/components/admin/platform-audit-panel"), "PlatformAuditPanel");
const PlatformAnnouncementsPanel = lazyPanel(() => import("@/components/admin/platform-announcements-panel"), "PlatformAnnouncementsPanel");
const PlatformUsersPanel = lazyPanel(() => import("@/components/admin/platform-users-panel"), "PlatformUsersPanel");
const PlatformSettingsPanel = lazyPanel(() => import("@/components/admin/platform-settings-panel"), "PlatformSettingsPanel");
const PlatformKvkkPanel = lazyPanel(() => import("@/components/admin/platform-kvkk-panel"), "PlatformKvkkPanel");
const PlatformHealthPanel = lazyPanel(() => import("@/components/admin/platform-health-panel"), "PlatformHealthPanel");
const Security2FAPanel = lazyPanel(() => import("@/components/admin/security-2fa-panel"), "Security2FAPanel");
const SecuritySessionsPanel = lazyPanel(() => import("@/components/admin/security-sessions-panel"), "SecuritySessionsPanel");
const PlatformPlansPanel = lazyPanel(() => import("@/components/admin/platform-plans-panel"), "PlatformPlansPanel");
const PlatformInvoicesPanel = lazyPanel(() => import("@/components/admin/platform-invoices-panel"), "PlatformInvoicesPanel");
const TenantApiKeysPanel = lazyPanel(() => import("@/components/admin/platform-devops-panels"), "TenantApiKeysPanel");
const PlatformRiskPanel = lazyPanel(() => import("@/components/admin/platform-devops-panels"), "PlatformRiskPanel");
const PlatformFlagsPanel = lazyPanel(() => import("@/components/admin/platform-devops-panels"), "PlatformFlagsPanel");
const PlatformEmailTemplatesPanel = lazyPanel(() => import("@/components/admin/platform-devops-panels"), "PlatformEmailTemplatesPanel");
const PlatformIncidentsPanel = lazyPanel(() => import("@/components/admin/platform-devops-panels"), "PlatformIncidentsPanel");
const PlatformTicketsPanel = lazyPanel(() => import("@/components/admin/platform-devops-panels"), "PlatformTicketsPanel");
const DriverExpensesPanel = lazyPanel(() => import("@/components/admin/driver-ops-panels"), "DriverExpensesPanel");
const DriverSosPanel = lazyPanel(() => import("@/components/admin/driver-ops-panels"), "DriverSosPanel");
const PreTripChecksPanel = lazyPanel(() => import("@/components/admin/driver-ops-panels"), "PreTripChecksPanel");
const LostItemsPanel = lazyPanel(() => import("@/components/admin/driver-ops-panels"), "LostItemsPanel");
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

                {/* Gating: sadece aktif tab mount edilir — dynamic import'un etkisi maksimum */}
                <TabsContent value="overview">
                  {activeTab === 'overview' && <SystemOverview onNavigate={setActiveTab} refreshKey={refreshKey} />}
                </TabsContent>
                <TabsContent value="revenue">
                  {activeTab === 'revenue' && <OverviewDashboard onNavigate={setActiveTab} />}
                </TabsContent>
                <TabsContent value="vehicles">{activeTab === 'vehicles' && <VehiclesPanel />}</TabsContent>
                <TabsContent value="stations">{activeTab === 'stations' && <StationsPanel />}</TabsContent>
                <TabsContent value="routes">{activeTab === 'routes' && <RoutesPanel />}</TabsContent>
                <TabsContent value="trips">{activeTab === 'trips' && <TripsPanel />}</TabsContent>
                <TabsContent value="bookings" className="mt-6">{activeTab === 'bookings' && <AdminBookingsPanel />}</TabsContent>
                <TabsContent value="drivers" className="mt-6">{activeTab === 'drivers' && <AdminDriversPanel />}</TabsContent>
                <TabsContent value="audit" className="mt-6">{activeTab === 'audit' && <AdminAuditLogsPanel />}</TabsContent>
                <TabsContent value="promo">{activeTab === 'promo' && <PromoPanel />}</TabsContent>
                <TabsContent value="feedback">{activeTab === 'feedback' && <FeedbackPanel />}</TabsContent>
                <TabsContent value="waiting-list">{activeTab === 'waiting-list' && <WaitingListPanel />}</TabsContent>
                <TabsContent value="tenant">{activeTab === 'tenant' && <TenantSettingsPanel />}</TabsContent>
                <TabsContent value="settlements">{activeTab === 'settlements' && <SettlementPanel onNavigate={setActiveTab} />}</TabsContent>
                <TabsContent value="super-tenants">{activeTab === 'super-tenants' && <SuperTenantsPanel />}</TabsContent>
                <TabsContent value="super-settlements">{activeTab === 'super-settlements' && <SuperSettlementsPanel />}</TabsContent>
                <TabsContent value="platform-overview">{activeTab === 'platform-overview' && <PlatformOverviewPanel onNavigate={setActiveTab} />}</TabsContent>
                <TabsContent value="platform-approvals">{activeTab === 'platform-approvals' && <PlatformApprovalsPanel />}</TabsContent>
                <TabsContent value="platform-lookup">{activeTab === 'platform-lookup' && <PlatformLookupPanel />}</TabsContent>
                <TabsContent value="platform-audit">{activeTab === 'platform-audit' && <PlatformAuditPanel />}</TabsContent>
                <TabsContent value="platform-announcements">{activeTab === 'platform-announcements' && <PlatformAnnouncementsPanel />}</TabsContent>
                <TabsContent value="platform-users">{activeTab === 'platform-users' && <PlatformUsersPanel />}</TabsContent>
                <TabsContent value="platform-settings">{activeTab === 'platform-settings' && <PlatformSettingsPanel />}</TabsContent>
                <TabsContent value="platform-kvkk">{activeTab === 'platform-kvkk' && <PlatformKvkkPanel />}</TabsContent>
                <TabsContent value="platform-health">{activeTab === 'platform-health' && <PlatformHealthPanel />}</TabsContent>
                <TabsContent value="security">{activeTab === 'security' && <div className="space-y-6"><Security2FAPanel /><SecuritySessionsPanel /></div>}</TabsContent>
                <TabsContent value="api-keys">{activeTab === 'api-keys' && <TenantApiKeysPanel />}</TabsContent>
                <TabsContent value="platform-plans">{activeTab === 'platform-plans' && <PlatformPlansPanel />}</TabsContent>
                <TabsContent value="platform-invoices">{activeTab === 'platform-invoices' && <PlatformInvoicesPanel />}</TabsContent>
                <TabsContent value="platform-risk">{activeTab === 'platform-risk' && <PlatformRiskPanel />}</TabsContent>
                <TabsContent value="platform-flags">{activeTab === 'platform-flags' && <PlatformFlagsPanel />}</TabsContent>
                <TabsContent value="platform-email-templates">{activeTab === 'platform-email-templates' && <PlatformEmailTemplatesPanel />}</TabsContent>
                <TabsContent value="platform-incidents">{activeTab === 'platform-incidents' && <PlatformIncidentsPanel />}</TabsContent>
                <TabsContent value="platform-tickets">{activeTab === 'platform-tickets' && <PlatformTicketsPanel />}</TabsContent>
                <TabsContent value="driver-expenses">{activeTab === 'driver-expenses' && <DriverExpensesPanel />}</TabsContent>
                <TabsContent value="driver-sos">{activeTab === 'driver-sos' && <DriverSosPanel />}</TabsContent>
                <TabsContent value="pre-trip-checks">{activeTab === 'pre-trip-checks' && <PreTripChecksPanel />}</TabsContent>
                <TabsContent value="lost-items">{activeTab === 'lost-items' && <LostItemsPanel />}</TabsContent>
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



