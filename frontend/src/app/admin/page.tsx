"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
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
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";
import { 
  Bus, 
  Plus, 
  RefreshCw,
  Route as RouteIcon,
  CalendarDays,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Search,
  CheckCircle2,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Vehicle {
  id: string;
  registrationPlate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  layoutType: string;
  status: string;
}

interface Station {
  id: string;
  name: string;
  city: string;
  locationLat: number | null;
  locationLng: number | null;
}

interface Route {
  id: string;
  originStation: Station;
  destinationStation: Station;
  basePrice: number | string;
  totalDistanceKm: number;
}

interface Trip {
  id: string;
  departureTime: string;
  status: string;
  route: Route;
  vehicle: Vehicle;
}

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
  
  // Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Loading & Error State
  const [loading, setLoading] = useState(true);

  const [drivers, setDrivers] = useState<any[]>([]);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes, rRes, tRes, dRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/stations").catch(() => ({ data: [] })),
        api.get("/routes").catch(() => ({ data: [] })),
        api.get("/trips").catch(() => ({ data: [] })),
        api.get("/users/drivers").catch(() => ({ data: [] })),
      ]);
      setVehicles(vRes.data);
      setStations(sRes.data);
      setRoutes(rRes.data);
      setTrips(tRes.data);
      setDrivers(dRes.data);
    } catch (err: any) {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

          <div className="flex items-center gap-4">
             <div className="relative hidden md:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Hızlı arama..." 
                  className="bg-zinc-100 dark:bg-zinc-900 border-none rounded-full py-2 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-zinc-800 transition-all w-64 outline-none border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
             </div>
             
             <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-zinc-500 dark:text-zinc-400"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
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
                 activeTab === 'vehicles' ? 'Araç Filosu' :
                 activeTab === 'stations' ? 'İstasyonlar & Terminaller' :
                 activeTab === 'routes' ? 'Rota Havuzu' :
                 activeTab === 'trips' ? 'Sefer Takvimi' :
                 activeTab === 'bookings' ? 'Bilet Yönetimi' :
                 activeTab === 'drivers' ? 'Sürücü Paneli' :
                 activeTab === 'audit' ? 'Denetim Logu' :
                 'Panel'}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">
                {activeTab === 'overview' ? 'Operasyonel özet ve sistem durumu.' :
                 activeTab === 'vehicles' ? 'Filonuzdaki araçları ve bakım durumlarını yönetin.' :
                 activeTab === 'stations' ? 'Otogar ve terminal lokasyonlarınız.' :
                 activeTab === 'routes' ? 'Kalkış-varış rotalarınız ve fiyatlandırma.' :
                 activeTab === 'trips' ? 'Planlanan ve aktif seferleriniz.' :
                 activeTab === 'bookings' ? 'Bilet satışları, iptaller ve iadeler.' :
                 activeTab === 'drivers' ? 'Şoför kadronuz ve yetkileri.' :
                 activeTab === 'audit' ? 'Tüm kritik işlemlerin denetim kaydı.' :
                 'Verileriniz burada.'}
              </p>
            </div>

            {/* Stats Grid — only on overview */}
            {activeTab === 'overview' && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <StatsCard label="Araç Filosu" value={vehicles.length.toString()} icon={Bus} trend={`${vehicles.filter(v => v.status === 'ACTIVE').length} aktif`} color="bg-indigo-50 text-indigo-600" />
               <StatsCard label="Rotalar" value={routes.length.toString()} icon={RouteIcon} trend={`${new Set(routes.map((r: any) => r.originStation?.city)).size} şehir`} color="bg-amber-50 text-amber-600" />
               <StatsCard label="Seferler" value={trips.length.toString()} icon={Activity} trend={`${trips.filter((t: any) => t.status === 'PLANNED' || t.status === 'ACTIVE').length} aktif/planlı`} color="bg-emerald-50 text-emerald-600" />
               <StatsCard label="Şoförler" value={drivers.length.toString()} icon={TrendingUp} trend="Kadro" color="bg-rose-50 text-rose-600" />
            </div>}

            {/* Tabs Content */}
            <div className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                <TabsContent value="overview">
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Sefer Oluştur', tab: 'trips', icon: CalendarDays, color: 'indigo' },
                        { label: 'Araç Ekle', tab: 'vehicles', icon: Bus, color: 'emerald' },
                        { label: 'Biletleri Gör', tab: 'bookings', icon: Activity, color: 'amber' },
                        { label: 'Denetim Logu', tab: 'audit', icon: Search, color: 'zinc' },
                      ].map(a => (
                        <button
                          key={a.tab}
                          onClick={() => setActiveTab(a.tab)}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group text-left"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                            a.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                            a.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            a.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}>
                            <a.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{a.label}</p>
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Hızlı Erişim</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 ml-auto group-hover:text-indigo-500 transition-colors" />
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Recent Trips */}
                      <Card className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <CardTitle className="text-base font-black tracking-tight text-zinc-900 dark:text-white flex items-center justify-between">
                            Yaklaşan Seferler
                            <button onClick={() => setActiveTab('trips')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Tümünü Gör →</button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {trips.filter((t: any) => t.status === 'PLANNED' || t.status === 'ACTIVE').length === 0 ? (
                            <p className="p-5 text-sm text-zinc-400 text-center font-semibold">Yaklaşan sefer yok</p>
                          ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {trips
                                .filter((t: any) => t.status === 'PLANNED' || t.status === 'ACTIVE')
                                .sort((a: any, b: any) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
                                .slice(0, 5)
                                .map((t: any) => (
                                  <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                        {t.route?.originStation?.city} → {t.route?.destinationStation?.city}
                                      </p>
                                      <p className="text-[10px] text-zinc-400 font-semibold">
                                        {new Date(t.departureTime).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} {new Date(t.departureTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        {' · '}{t.vehicle?.registrationPlate}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                      t.status === 'ACTIVE'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50'
                                    }`}>
                                      {t.status === 'ACTIVE' ? 'Aktif' : 'Planlı'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* System Health */}
                      <Card className="rounded-2xl bg-zinc-950 border-none shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                          <Bus size={160} strokeWidth={3} />
                        </div>
                        <CardHeader className="p-5 pb-3">
                          <CardTitle className="text-base font-black text-white">Sistem Durumu</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-2 space-y-5 relative z-10">
                          <div className="space-y-3">
                            <HealthBar label="Araç Kullanımı" value={vehicles.length ? Math.round(vehicles.filter(v => v.status === 'ACTIVE').length / vehicles.length * 100) : 0} />
                            <HealthBar label="Rota Kapsama" value={routes.length > 0 ? Math.min(100, routes.length * 10) : 0} />
                            <HealthBar label="Şoför Doluluk" value={drivers.length > 0 ? Math.min(100, Math.round(trips.filter((t: any) => t.status === 'PLANNED' || t.status === 'ACTIVE').length / Math.max(1, drivers.length) * 100)) : 0} />
                          </div>
                          <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tüm Sistemler Çalışıyor</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Bottom: Routes + Drivers quick */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Routes */}
                      <Card className="rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <CardTitle className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Rotalar</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {routes.length === 0 ? (
                            <p className="p-5 text-sm text-zinc-400 text-center font-semibold">Rota tanımlanmamış</p>
                          ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {routes.slice(0, 4).map((r: any) => (
                                <div key={r.id} className="flex items-center justify-between p-4">
                                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{r.originStation?.name} <span className="text-indigo-500 mx-1">→</span> {r.destinationStation?.name}</span>
                                  <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">₺{Number(r.basePrice).toLocaleString('tr-TR')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Driver Overview */}
                      <Card className="rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <CardTitle className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Şoför Kadrosu</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {drivers.length === 0 ? (
                            <p className="p-5 text-sm text-zinc-400 text-center font-semibold">Şoför eklenmemiş</p>
                          ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {drivers.slice(0, 4).map((d: any) => (
                                <div key={d.id} className="flex items-center gap-3 p-4">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                                    {d.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{d.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-semibold">{d.email}</p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                                    {d._count?.driverTrips ?? 0} sefer
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vehicles"><VehiclesPanel /></TabsContent>
                <TabsContent value="stations"><StationsPanel /></TabsContent>
                <TabsContent value="routes"><RoutesPanel /></TabsContent>
                <TabsContent value="trips"><TripsPanel /></TabsContent>
                <TabsContent value="bookings" className="mt-6"><AdminBookingsPanel /></TabsContent>
                <TabsContent value="drivers" className="mt-6"><AdminDriversPanel /></TabsContent>
                <TabsContent value="audit" className="mt-6"><AdminAuditLogsPanel /></TabsContent>
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

function StatsCard({ label, value, icon: Icon, trend, color }: any) {
  return (
    <Card className="rounded-[28px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md cursor-default group overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-2xl ${color} dark:bg-opacity-10 shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{trend}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{value}</span>
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}


function HealthBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-white">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-20 h-20 rounded-[28px] bg-zinc-50 dark:bg-zinc-900 shadow-inner flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800 ring-1 ring-zinc-950/5 transition-colors">
        <Icon className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
      </div>
      <h3 className="text-xl font-black mb-2 tracking-tighter text-zinc-900 dark:text-zinc-100">{label}</h3>
      <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">Henüz veri akışı saptanmadı.</p>
    </div>
  );
}


