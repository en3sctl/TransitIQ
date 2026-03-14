"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/protected-route";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form States
  const [vehicleForm, setVehicleForm] = useState({ registrationPlate: "", make: "", model: "", year: "", chassisNumber: "", capacity: "" });
  const [stationForm, setStationForm] = useState({ name: "", city: "", locationLat: "", locationLng: "" });
  const [routeForm, setRouteForm] = useState({ originStationId: "", destinationStationId: "", basePrice: "", title: "", totalDistanceKm: "" });
  const [tripForm, setTripForm] = useState({ routeId: "", vehicleId: "", departureTime: "", driverId: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes, rRes, tRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/stations").catch(() => ({ data: [] })),
        api.get("/routes").catch(() => ({ data: [] })),
        api.get("/trips").catch(() => ({ data: [] })),
      ]);
      setVehicles(vRes.data);
      setStations(sRes.data);
      setRoutes(rRes.data);
      setTrips(tRes.data);
    } catch (err: any) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        registrationPlate: vehicleForm.registrationPlate,
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: Number(vehicleForm.year),
        chassisNumber: vehicleForm.chassisNumber,
        capacity: Number(vehicleForm.capacity),
      };
      await api.post("/vehicles", payload);
      setVehicleForm({ registrationPlate: "", make: "", model: "", year: "", chassisNumber: "", capacity: "" });
      setIsDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/stations", {
        name: stationForm.name,
        city: stationForm.city,
        locationLat: stationForm.locationLat ? Number(stationForm.locationLat) : null,
        locationLng: stationForm.locationLng ? Number(stationForm.locationLng) : null,
      });
      setStationForm({ name: "", city: "", locationLat: "", locationLng: "" });
      setIsDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/routes", {
        title: routeForm.title || `${stations.find(s => s.id === routeForm.originStationId)?.city} - ${stations.find(s => s.id === routeForm.destinationStationId)?.city}`,
        originStationId: routeForm.originStationId,
        destinationStationId: routeForm.destinationStationId,
        basePrice: Number(routeForm.basePrice),
        totalDistanceKm: Number(routeForm.totalDistanceKm) || 0,
        taxRate: 0.18,
      });
      setRouteForm({ originStationId: "", destinationStationId: "", basePrice: "", title: "", totalDistanceKm: "" });
      setIsDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        routeId: tripForm.routeId,
        vehicleId: tripForm.vehicleId,
        departureTime: new Date(tripForm.departureTime).toISOString(),
        driverId: user?.id,
      };
      await api.post("/trips", payload);
      setTripForm({ routeId: "", vehicleId: "", departureTime: "", driverId: "" });
      setIsDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
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

              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger
                  render={
                    <Button className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white rounded-xl h-10 px-5 text-xs font-black shadow-sm transition-all active:scale-[0.98]">
                      <Plus className="mr-2 h-4 w-4 stroke-[3]" /> 
                      {activeTab === 'vehicles' ? 'Araç Ekle' : activeTab === 'stations' ? 'İstasyon Ekle' : activeTab === 'routes' ? 'Rota Oluştur' : 'Sefer Ata'}
                    </Button>
                  }
                />
                <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[32px] sm:max-w-lg p-10 shadow-2xl overflow-hidden ring-1 ring-zinc-950/5">
                  <DialogHeader className="mb-8 p-1">
                    <DialogTitle className="text-3xl font-black tracking-tighter">
                      {activeTab === 'vehicles' ? 'Yeni Araç Kaydı' : activeTab === 'stations' ? 'Yeni İstasyon' : activeTab === 'routes' ? 'Rota Genişletme' : 'Kaynak Dağıtımı'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-base mt-2">
                      Sistem için gerekli parametreleri aşağıda yapılandırın.
                    </DialogDescription>
                  </DialogHeader>

                  <DynamicForm 
                    activeTab={activeTab}
                    forms={{ vehicleForm, stationForm, routeForm, tripForm, setVehicleForm, setStationForm, setRouteForm, setTripForm }}
                    handlers={{ handleVehicleSubmit, handleStationSubmit, handleRouteSubmit, handleTripSubmit }}
                    data={{ routes, vehicles, stations }}
                    isSubmitting={isSubmitting}
                  />
                </DialogContent>
              </Dialog>
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
                {activeTab === 'overview' ? `Merhaba, ${user?.name.split(' ')[0]} 👋` : 
                 activeTab === 'vehicles' ? 'Araç Filosu' : 
                 activeTab === 'stations' ? 'İstasyonlar & Terminaller' :
                 activeTab === 'routes' ? 'Rota Havuzu' : 'Operasyonel Akış'}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-snug">
                Modern lojistik yönetimi için verileriniz burada.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
               <StatsCard label="Aktif Araçlar" value={vehicles.length.toString()} icon={Bus} trend="+4 yeni" color="bg-indigo-50 text-indigo-600" />
               <StatsCard label="Sistem Rotaları" value={routes.length.toString()} icon={RouteIcon} trend="Aktif ağ" color="bg-amber-50 text-amber-600" />
               <StatsCard label="Toplam Sefer" value={trips.length.toString()} icon={Activity} trend="99% verim" color="bg-emerald-50 text-emerald-600" />
               <StatsCard label="Operasyonel Güç" value="%94" icon={TrendingUp} trend="Mükemmel" color="bg-rose-50 text-rose-600" />
            </div>

            {/* Tabs Content */}
            <div className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 mb-10 rounded-2xl w-full md:w-fit h-12 inline-flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 transition-colors">
                  <TabsTrigger value="overview" className="px-6 rounded-xl font-bold text-xs uppercase tracking-widest py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm transition-all">Genel Bakış</TabsTrigger>
                  <TabsTrigger value="vehicles" className="px-6 rounded-xl font-bold text-xs uppercase tracking-widest py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm transition-all">Filo</TabsTrigger>
                  <TabsTrigger value="stations" className="px-6 rounded-xl font-bold text-xs uppercase tracking-widest py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm transition-all">İstasyonlar</TabsTrigger>
                  {/* Temporarily disabled Routes and Trips for schema alignment */}
                  <TabsTrigger value="routes" className="px-6 rounded-xl font-bold text-xs uppercase tracking-widest py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm transition-all">Rotalar</TabsTrigger>
                  <TabsTrigger value="trips" className="px-6 rounded-xl font-bold text-xs uppercase tracking-widest py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm transition-all">Seferler</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <Card className="lg:col-span-2 rounded-[32px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-2 transition-colors">
                         <CardHeader className="p-8 pb-4"><CardTitle className="text-xl font-black text-zinc-900 dark:text-zinc-100">Sistem Özeti</CardTitle></CardHeader>
                         <CardContent className="p-8 pt-0">
                            <div className="space-y-6">
                               <p className="text-zinc-500 dark:text-zinc-400 font-medium">Operasyonel verileriniz gerçek zamanlı olarak güncelleniyor. Şu an sistemde her şey yolunda.</p>
                               <div className="flex flex-wrap gap-4">
                                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-bold bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-xl text-[13px] border border-zinc-100 dark:border-zinc-800 transition-colors">
                                     <CheckCircle2 size={16} className="text-emerald-500" /> %100 Sunucu Uptime
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-bold bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-xl text-[13px] border border-zinc-100 dark:border-zinc-800 transition-colors">
                                     <ArrowUpRight size={16} className="text-indigo-500" /> Verimlilik Artışı
                                  </div>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                      <Card className="rounded-[32px] bg-zinc-950 border-none shadow-2xl p-2 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 text-zinc-800 transition-transform group-hover:scale-110 duration-500">
                            <Bus size={80} strokeWidth={4} />
                         </div>
                         <CardHeader className="p-8"><CardTitle className="text-xl font-black text-white">Sistem Sağlığı</CardTitle></CardHeader>
                         <CardContent className="p-8 pt-0 space-y-4">
                            <p className="text-zinc-400 font-semibold text-sm leading-relaxed">Kapasite Verimliliği</p>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 w-3/4 rounded-full" />
                            </div>
                            <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest mt-2">İşlem Hızı: %98</p>
                         </CardContent>
                      </Card>
                   </div>
                </TabsContent>

                <TabsContent value="vehicles"><TableCard title="Filo Yönetimi" count={vehicles.length}><VehiclesTable vehicles={vehicles} /></TableCard></TabsContent>
                <TabsContent value="stations"><TableCard title="İstasyon Yönetimi" count={stations.length}><StationsTable stations={stations} /></TableCard></TabsContent>
                <TabsContent value="routes"><TableCard title="Ağ Haritası" count={routes.length}><RoutesTable routes={routes} /></TableCard></TabsContent>
                <TabsContent value="trips"><TableCard title="Sefer Kayıtları" count={trips.length}><TripsTable trips={trips} /></TableCard></TabsContent>
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

function TableCard({ title, count, children }: any) {
  return (
    <Card className="rounded-[40px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ring-1 ring-zinc-950/5 transition-colors duration-500">
      <CardHeader className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">{title}</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-widest">{count} Kayıt Mevcut</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function VehiclesTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return <EmptyState icon={Bus} label="Henüz araç eklenmemiş" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
          <TableRow className="hover:bg-transparent border-none font-black text-[11px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 h-14">
            <TableHead className="px-8">Araç / Plaka</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Kapasite</TableHead>
            <TableHead className="text-right px-8">Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
              <TableCell className="py-6 px-8 text-zinc-900 dark:text-zinc-100 font-bold text-base">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-all">
                    <Bus size={20} className="text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span>{v.registrationPlate}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{v.make}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-zinc-900 dark:text-zinc-100 font-semibold">{v.model} ({v.year})</TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400 font-semibold">{v.capacity} Kişi</TableCell>
              <TableCell className="text-right px-8">
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">{v.status}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RoutesTable({ routes }: { routes: Route[] }) {
  if (routes.length === 0) return <EmptyState icon={RouteIcon} label="Henüz rota tanımlanmamış" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
          <TableRow className="hover:bg-transparent border-none font-black text-[11px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 h-14">
            <TableHead className="px-8">Durak A ➔ Durak B</TableHead>
            <TableHead>Mesafe</TableHead>
            <TableHead className="text-right px-8">Taban Fiyat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((r) => (
            <TableRow key={r.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
              <TableCell className="py-6 px-8 text-zinc-900 dark:text-zinc-100 font-extrabold text-lg tracking-tight">
                 {r.originStation?.name} <span className="text-indigo-600 dark:text-indigo-400 mx-2">➔</span> {r.destinationStation?.name}
              </TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400 font-bold">{r.totalDistanceKm} KM</TableCell>
              <TableCell className="text-right px-8 font-black text-xl text-zinc-950 dark:text-zinc-100">₺{r.basePrice}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TripsTable({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) return <EmptyState icon={CalendarDays} label="Sefer kaydı bulunamadı" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
          <TableRow className="hover:bg-transparent border-none font-black text-[11px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 h-14">
            <TableHead className="px-8">Zaman Çizelgesi</TableHead>
            <TableHead>Atanan Araç</TableHead>
            <TableHead className="text-right px-8">Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((t) => (
            <TableRow key={t.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
              <TableCell className="py-6 px-8">
                <div className="flex flex-col">
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold text-base">
                    {new Date(t.departureTime).toLocaleDateString()} at {new Date(t.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] mt-0.5 uppercase tracking-widest">
                    {t.route?.originStation?.name || 'Unknown'} ➔ {t.route?.destinationStation?.name || 'Unknown'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                    <Bus size={18} />
                  </div>
                  <span className="font-bold">{t.vehicle?.registrationPlate ?? 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell className="text-right px-8">
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">Onaylandı</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

function DynamicForm({ activeTab, forms, handlers, data, isSubmitting }: any) {
  const { vehicleForm, stationForm, routeForm, tripForm, setVehicleForm, setStationForm, setRouteForm, setTripForm } = forms;
  const { handleVehicleSubmit, handleStationSubmit, handleRouteSubmit, handleTripSubmit } = handlers;
  const { routes, vehicles, stations } = data;

  if (activeTab === 'vehicles') {
    return (
      <form onSubmit={handleVehicleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Marka</Label>
              <Input className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="Mercedes-Benz" value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Model</Label>
              <Input className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="Travego 15 SHD" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Plaka</Label>
              <Input className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="34 ABC 123" value={vehicleForm.registrationPlate} onChange={e => setVehicleForm({...vehicleForm, registrationPlate: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Model Yılı</Label>
              <Input type="number" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="2024" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Kapasite</Label>
              <Input type="number" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="46" value={vehicleForm.capacity} onChange={e => setVehicleForm({...vehicleForm, capacity: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Şasi No</Label>
              <Input className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="WDB..." value={vehicleForm.chassisNumber} onChange={e => setVehicleForm({...vehicleForm, chassisNumber: e.target.value})} required />
            </div>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white h-16 rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-[0.97]">
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Aracı Filoya Ekle"}
        </Button>
      </form>
    );
  }

  if (activeTab === 'stations') {
    return (
      <form onSubmit={handleStationSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">İstasyon / Terminal Adı</Label>
            <Input className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="Esenler Otogarı" value={stationForm.name} onChange={e => setStationForm({...stationForm, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Şehir</Label>
            <Input className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="İstanbul" value={stationForm.city} onChange={e => setStationForm({...stationForm, city: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Enlem (Lat)</Label>
              <Input type="number" step="any" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="41.035" value={stationForm.locationLat} onChange={e => setStationForm({...stationForm, locationLat: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Boylam (Lng)</Label>
              <Input type="number" step="any" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold" placeholder="28.892" value={stationForm.locationLng} onChange={e => setStationForm({...stationForm, locationLng: e.target.value})} />
            </div>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white h-16 rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-[0.97]">
          {isSubmitting ? <Loader2 className="animate-spin" /> : "İstasyonu Kaydet"}
        </Button>
      </form>
    );
  }

  if (activeTab === 'routes') {
    return (
      <form onSubmit={handleRouteSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Başlangıç İstasyonu</Label>
              <Select value={routeForm.originStationId} onValueChange={(v) => setRouteForm({...routeForm, originStationId: v})}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold">
                  <SelectValue placeholder="İstasyon Seçin">
                    {stations.find((s: Station) => s.id === routeForm.originStationId) 
                      ? `${stations.find((s: Station) => s.id === routeForm.originStationId).name} (${stations.find((s: Station) => s.id === routeForm.originStationId).city})` 
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl p-2">
                  {stations.map((s: Station) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.city})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Varış İstasyonu</Label>
              <Select value={routeForm.destinationStationId} onValueChange={(v) => setRouteForm({...routeForm, destinationStationId: v})}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold">
                  <SelectValue placeholder="İstasyon Seçin">
                    {stations.find((s: Station) => s.id === routeForm.destinationStationId) 
                      ? `${stations.find((s: Station) => s.id === routeForm.destinationStationId).name} (${stations.find((s: Station) => s.id === routeForm.destinationStationId).city})` 
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl p-2">
                  {stations.map((s: Station) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.city})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Taban Fiyat (₺)</Label>
              <Input type="number" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" placeholder="750" value={routeForm.basePrice} onChange={e => setRouteForm({...routeForm, basePrice: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Tahmini Mesafe (KM)</Label>
              <Input type="number" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" placeholder="450" value={routeForm.totalDistanceKm} onChange={e => setRouteForm({...routeForm, totalDistanceKm: e.target.value})} required />
            </div>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white h-16 rounded-[24px] font-black text-xl shadow-xl transition-all">
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Rotayı Tanımla"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleTripSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Rota</Label>
          <Select value={tripForm.routeId} onValueChange={(v) => setTripForm({...tripForm, routeId: v})}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold text-left outline-none text-zinc-900 dark:text-zinc-100 transition-all">
              <SelectValue placeholder="Rota Seçin">
                {routes.find((r: Route) => r.id === tripForm.routeId)
                  ? `${routes.find((r: Route) => r.id === tripForm.routeId).originStation?.name} ➔ ${routes.find((r: Route) => r.id === tripForm.routeId).destinationStation?.name}`
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl p-2 shadow-2xl">
              <AnimatePresence>
                {routes.map((r: any) => (
                  <SelectItem key={r.id} value={r.id} className="rounded-xl p-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-950 dark:focus:text-zinc-100 cursor-pointer">
                    {r.originStation?.name} ➔ {r.destinationStation?.name}
                  </SelectItem>
                ))}
              </AnimatePresence>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Araç</Label>
          <Select value={tripForm.vehicleId} onValueChange={(v) => setTripForm({...tripForm, vehicleId: v})}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold text-left outline-none text-zinc-900 dark:text-zinc-100 transition-all">
              <SelectValue placeholder="Araç Seçin">
                {vehicles.find((v: Vehicle) => v.id === tripForm.vehicleId)
                  ? `${vehicles.find((v: Vehicle) => v.id === tripForm.vehicleId).make} - ${vehicles.find((v: Vehicle) => v.id === tripForm.vehicleId).registrationPlate}`
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl p-2 shadow-2xl">
              <AnimatePresence>
                {vehicles.map((v: any) => (
                  <SelectItem key={v.id} value={v.id} className="rounded-xl p-3 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-950 dark:focus:text-zinc-100 cursor-pointer">
                    {v.make} - {v.registrationPlate}
                  </SelectItem>
                ))}
              </AnimatePresence>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Zaman</Label>
          <Input type="datetime-local" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-14 rounded-2xl font-bold text-zinc-900 dark:text-zinc-100 transition-all outline-none" value={tripForm.departureTime} onChange={e => setTripForm({...tripForm, departureTime: e.target.value})} required />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white h-16 rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-[0.97]">
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Seferi Başlat"}
      </Button>
    </form>
  );
}

function StationsTable({ stations }: { stations: Station[] }) {
  if (stations.length === 0) return <EmptyState icon={Search} label="Henüz istasyon eklenmemiş" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
          <TableRow className="hover:bg-transparent border-none font-black text-[11px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 h-14">
            <TableHead className="px-8" style={{ width: '50%' }}>İstasyon Adı</TableHead>
            <TableHead style={{ width: '25%' }}>Şehir</TableHead>
            <TableHead className="text-right px-8" style={{ width: '25%' }}>Koordinatlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.map((s) => (
            <TableRow key={s.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
              <TableCell className="py-6 px-8 text-zinc-900 dark:text-zinc-100 font-bold text-base">{s.name}</TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400 font-semibold">{s.city}</TableCell>
              <TableCell className="text-right px-8 font-mono text-[10px] text-zinc-400">
                {s.locationLat && s.locationLng ? `${s.locationLat}, ${s.locationLng}` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
