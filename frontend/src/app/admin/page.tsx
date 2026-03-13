"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/protected-route";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
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
  LayoutDashboard, 
  Users, 
  Map, 
  Settings, 
  LogOut, 
  Loader2,
  RefreshCw,
  Route as RouteIcon,
  CalendarDays,
  TrendingUp,
  Activity,
  ShieldCheck
} from "lucide-react";

interface Vehicle {
  id: string;
  plateNumber: string;
  capacity: number;
  fuelConsumptionPer100km: number;
  status: string;
}

interface Route {
  id: string;
  startLocation: string;
  endLocation: string;
  basePrice: number | string;
  totalDistanceKm: number;
}

interface Trip {
  id: string;
  startTime: string;
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
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Loading & Error State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form States
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: "", capacity: "", fuelConsumptionPer100km: "" });
  const [routeForm, setRouteForm] = useState({ startLocation: "", endLocation: "", basePrice: "", title: "" });
  const [tripForm, setTripForm] = useState({ routeId: "", vehicleId: "", departureTime: "", driverId: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, rRes, tRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/routes"),
        api.get("/trips").catch(() => ({ data: [] }))
      ]);
      setVehicles(vRes.data);
      setRoutes(rRes.data);
      setTrips(tRes.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to sync with backend. Check connectivity.");
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
      await api.post("/vehicles", {
        ...vehicleForm,
        capacity: Number(vehicleForm.capacity),
        fuelConsumptionPer100km: Number(vehicleForm.fuelConsumptionPer100km),
      });
      setVehicleForm({ plateNumber: "", capacity: "", fuelConsumptionPer100km: "" });
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
        ...routeForm,
        basePrice: Number(routeForm.basePrice),
        taxRate: 0.18,
      });
      setRouteForm({ startLocation: "", endLocation: "", basePrice: "", title: "" });
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
    <div className="flex min-h-screen bg-[#050505] text-neutral-50 font-sans selection:bg-indigo-500/30">
      {/* Premium Sidebar */}
      <aside className="w-80 border-r border-neutral-900 hidden lg:flex flex-col p-8 sticky top-0 h-screen bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-2xl shadow-indigo-600/40 rotate-3 hover:rotate-0 transition-transform cursor-pointer">T</div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter leading-none">Transit<span className="text-indigo-500">IQ</span></span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Enterprise SaaS</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <p className="px-4 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">Main Navigation</p>
          {[
            { id: "overview", icon: LayoutDashboard, label: 'Dashboard' },
            { id: "vehicles", icon: Bus, label: 'Fleet Assets' },
            { id: "routes", icon: RouteIcon, label: 'Network' },
            { id: "trips", icon: CalendarDays, label: 'Schedules' },
            { id: "drivers", icon: Users, label: 'Personnel' },
            { id: "settings", icon: Settings, label: 'Preferences' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-5 py-4 rounded-[20px] text-sm font-bold transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_40px_-15px_rgba(79,70,229,0.3)]' 
                  : 'text-neutral-500 hover:bg-neutral-900/50 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 transition-all duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                {item.label}
              </div>
              {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />}
            </button>
          ))}
        </div>

        <div className="pt-8 border-t border-neutral-900 mt-auto">
          <div className="bg-neutral-900/40 border border-neutral-800/50 p-4 rounded-3xl mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              {user?.name?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black truncate">{user?.name}</span>
              <span className="text-[10px] text-neutral-500 font-bold truncate tracking-tight">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold text-neutral-500 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Logout System
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent">
        <div className="p-12 max-w-7xl mx-auto">
          {/* Top Bar / Identity */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3" /> Secure Tenant: {user?.tenantId}
                 </div>
              </div>
              <h2 className="text-5xl font-black tracking-tighter leading-tight bg-gradient-to-br from-white via-white to-neutral-700 bg-clip-text text-transparent">
                {activeTab === 'overview' ? 'Command Center' : 
                 activeTab === 'vehicles' ? 'Asset Fleet' : 
                 activeTab === 'routes' ? 'Global Network' : 'Operations Flow'}
              </h2>
              <p className="text-neutral-500 text-lg font-medium max-w-xl">
                Precision management for the future of transportation.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-neutral-900/40 backdrop-blur-md p-2 rounded-[28px] border border-neutral-800/50">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-12 h-12 rounded-2xl hover:bg-neutral-800 transition-all text-neutral-400 hover:text-white"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-black hover:bg-neutral-200 rounded-[20px] h-12 px-8 font-black shadow-2xl shadow-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="mr-3 h-5 w-5 stroke-[3]" /> 
                    {activeTab === 'vehicles' ? 'New Asset' : activeTab === 'routes' ? 'New Route' : 'New Schedule'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 rounded-[40px] sm:max-w-[540px] p-10 shadow-[0_0_100px_-20px_rgba(0,0,0,1)] ring-1 ring-white/5">
                  <DialogHeader className="mb-8 p-1">
                    <DialogTitle className="text-3xl font-black tracking-tighter">
                      {activeTab === 'vehicles' ? 'Asset Registration' : activeTab === 'routes' ? 'Network expansion' : 'Resource Deployment'}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400 font-medium text-base">
                      Configure parameters for {activeTab === 'vehicles' ? 'fleet addition' : 'operational growth'}.
                    </DialogDescription>
                  </DialogHeader>

                  <DynamicForm 
                    activeTab={activeTab}
                    forms={{ vehicleForm, routeForm, tripForm, setVehicleForm, setRouteForm, setTripForm }}
                    handlers={{ handleVehicleSubmit, handleRouteSubmit, handleTripSubmit }}
                    data={{ routes, vehicles }}
                    isSubmitting={isSubmitting}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Dash Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
             <StatsCard label="Fleet Power" value={vehicles.length.toString()} icon={Bus} trend="+12% cap" color="text-indigo-400" />
             <StatsCard label="Active Paths" value={routes.length.toString()} icon={RouteIcon} trend="Global" color="text-amber-400" />
             <StatsCard label="Total Ops" value={trips.length.toString()} icon={Activity} trend="99.9% uptime" color="text-emerald-400" />
             <StatsCard label="Efficiency" value="94%" icon={TrendingUp} trend="System Wide" color="text-rose-400" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-neutral-900/30 p-1.5 mb-10 rounded-[24px] border border-neutral-900/50 w-full md:w-fit h-14 backdrop-blur-sm">
              <TabsTrigger value="overview" className="px-10 rounded-2xl font-black text-xs uppercase tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Overview</TabsTrigger>
              <TabsTrigger value="vehicles" className="px-10 rounded-2xl font-black text-xs uppercase tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Fleet</TabsTrigger>
              <TabsTrigger value="routes" className="px-10 rounded-2xl font-black text-xs uppercase tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Routes</TabsTrigger>
              <TabsTrigger value="trips" className="px-10 rounded-2xl font-black text-xs uppercase tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Trips</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="focus:outline-none">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="rounded-[40px] bg-neutral-900/40 border-neutral-800/50 backdrop-blur-md p-2">
                    <CardHeader className="p-8"><CardTitle className="text-2xl font-black tracking-tight">Recent Activity</CardTitle></CardHeader>
                    <CardContent className="p-8 pt-0"><p className="text-neutral-500 font-medium">System performance is optimal. 24 fleets checked in today.</p></CardContent>
                  </Card>
                  <Card className="rounded-[40px] bg-indigo-600 border-none p-2 shadow-2xl shadow-indigo-600/20">
                     <CardHeader className="p-8"><CardTitle className="text-2xl font-black tracking-tight text-white">System Health</CardTitle></CardHeader>
                     <CardContent className="p-8 pt-0"><p className="text-indigo-100 font-medium">Auto-scaling active. All sensors reporting normal levels for {user?.name}'s organization.</p></CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="vehicles"><TableCard title="Asset Management" count={vehicles.length}><VehiclesTable vehicles={vehicles} /></TableCard></TabsContent>
            <TabsContent value="routes"><TableCard title="Route Network" count={routes.length}><RoutesTable routes={routes} /></TableCard></TabsContent>
            <TabsContent value="trips"><TableCard title="Operational Log" count={trips.length}><TripsTable trips={trips} /></TableCard></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, trend, color }: any) {
  return (
    <Card className="rounded-[36px] bg-neutral-900/40 border border-neutral-800/30 backdrop-blur-sm group hover:border-neutral-700 transition-all cursor-default">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl bg-neutral-800/50 ${color} shadow-inner group-hover:bg-neutral-800 transition-all`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{trend}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-4xl font-black mb-1 tracking-tighter">{value}</span>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TableCard({ title, count, children }: any) {
  return (
    <Card className="rounded-[48px] bg-neutral-900/30 border border-neutral-800/50 backdrop-blur-md shadow-2xl overflow-hidden ring-1 ring-white/5">
      <CardHeader className="p-10 border-b border-neutral-800/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-3xl font-black tracking-tighter">{title}</CardTitle>
          <CardDescription className="text-neutral-500 font-bold mt-2 tracking-wide uppercase text-[10px]">{count} Records Identified</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

// Reuse table components with slightly updated styles
function VehiclesTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return <EmptyState icon={Bus} label="No assets available" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-black/40 border-b border-neutral-800">
          <TableRow className="hover:bg-transparent border-none font-black text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            <TableHead className="px-10 h-16">Asset Identity</TableHead>
            <TableHead>Config</TableHead>
            <TableHead>Efficiency</TableHead>
            <TableHead className="text-right px-10">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.id} className="border-b border-neutral-800/30 hover:bg-white/[0.02] transition-colors group">
              <TableCell className="py-8 px-10 text-neutral-100 font-black text-lg tracking-tight">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[18px] bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                    <Bus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  {v.plateNumber}
                </div>
              </TableCell>
              <TableCell className="text-neutral-400 font-bold">{v.capacity} Slots</TableCell>
              <TableCell className="text-neutral-500 font-medium">{v.fuelConsumptionPer100km}L Cons.</TableCell>
              <TableCell className="text-right px-10">
                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_-10px_rgba(99,102,241,0.5)]">Operational</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RoutesTable({ routes }: { routes: Route[] }) {
  if (routes.length === 0) return <EmptyState icon={RouteIcon} label="Network undefined" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-black/40 border-b border-neutral-800">
          <TableRow className="hover:bg-transparent border-none font-black text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            <TableHead className="px-10 h-16">Route Corridor</TableHead>
            <TableHead>Metrics</TableHead>
            <TableHead className="text-right px-10">Valuation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((r) => (
            <TableRow key={r.id} className="border-b border-neutral-800/30 hover:bg-white/[0.02] transition-colors group">
              <TableCell className="py-8 px-10 text-neutral-100 font-black text-lg tracking-tight">
                 {r.startLocation} <span className="text-indigo-500 font-black mx-2">→</span> {r.endLocation}
              </TableCell>
              <TableCell className="text-neutral-400 font-bold">{r.totalDistanceKm} KM Distance</TableCell>
              <TableCell className="text-right px-10 font-black text-2xl text-white">₺{r.basePrice}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TripsTable({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) return <EmptyState icon={CalendarDays} label="Log is empty" />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-black/40 border-b border-neutral-800">
          <TableRow className="hover:bg-transparent border-none font-black text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            <TableHead className="px-10 h-16">Operational Timeline</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead className="text-right px-10">Auth Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((t) => (
            <TableRow key={t.id} className="border-b border-neutral-800/30 hover:bg-white/[0.02] transition-colors group">
              <TableCell className="py-8 px-10">
                <div className="flex flex-col">
                  <span className="text-neutral-100 font-black text-lg tracking-tight">{new Date(t.startTime).toLocaleDateString()} at {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="text-indigo-400 font-bold text-xs mt-1 uppercase tracking-widest">{t.route?.startLocation} ➔ {t.route?.endLocation}</span>
                </div>
              </TableCell>
              <TableCell className="text-neutral-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50 group-hover:bg-white/5 transition-all">
                    <Bus className="w-5 h-5 text-neutral-500" />
                  </div>
                  <span className="font-bold">{t.vehicle?.plateNumber}</span>
                </div>
              </TableCell>
              <TableCell className="text-right px-10">
                <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Verified</span>
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
    <div className="flex flex-col items-center justify-center py-32 px-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-24 h-24 rounded-[32px] bg-neutral-900 shadow-inner flex items-center justify-center mb-8 border border-neutral-800/50 ring-1 ring-white/5">
        <Icon className="w-10 h-10 text-neutral-600" />
      </div>
      <h3 className="text-2xl font-black mb-3 tracking-tighter text-white">{label}</h3>
      <p className="text-neutral-500 text-sm max-w-sm font-medium leading-relaxed uppercase tracking-widest text-[10px]">No active data stream detected. Please initialize a new resource to begin monitoring.</p>
    </div>
  );
}

function DynamicForm({ activeTab, forms, handlers, data, isSubmitting }: any) {
  const { vehicleForm, routeForm, tripForm, setVehicleForm, setRouteForm, setTripForm } = forms;
  const { handleVehicleSubmit, handleRouteSubmit, handleTripSubmit } = handlers;
  const { routes, vehicles } = data;

  if (activeTab === 'vehicles') {
    return (
      <form onSubmit={handleVehicleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Asset Plate Identifier</Label>
            <Input className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl focus:ring-2 focus:ring-indigo-600 border-none ring-1 ring-white/5" placeholder="e.g. 34-IQ-TRANSIT" value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Seating Cap.</Label>
              <Input type="number" className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5" placeholder="45" value={vehicleForm.capacity} onChange={e => setVehicleForm({...vehicleForm, capacity: e.target.value})} required />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Efficiency (L)</Label>
              <Input type="number" step="0.1" className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5" placeholder="24.5" value={vehicleForm.fuelConsumptionPer100km} onChange={e => setVehicleForm({...vehicleForm, fuelConsumptionPer100km: e.target.value})} required />
            </div>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-white text-black hover:bg-neutral-200 h-16 rounded-[24px] font-black text-xl shadow-2xl transition-all active:scale-[0.97]">
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Asset"}
        </Button>
      </form>
    );
  }

  if (activeTab === 'routes') {
    return (
      <form onSubmit={handleRouteSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Origin Terminal</Label>
              <Input className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5" placeholder="Node A" value={routeForm.startLocation} onChange={e => setRouteForm({...routeForm, startLocation: e.target.value})} required />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Destination</Label>
              <Input className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5" placeholder="Node B" value={routeForm.endLocation} onChange={e => setRouteForm({...routeForm, endLocation: e.target.value})} required />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Valuation (₺ Per Seat)</Label>
            <Input type="number" className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5" placeholder="750" value={routeForm.basePrice} onChange={e => setRouteForm({...routeForm, basePrice: e.target.value})} required />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-white text-black hover:bg-neutral-200 h-16 rounded-[24px] font-black text-xl shadow-2xl transition-all">
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Initialize Corridor"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleTripSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Operational Corridor</Label>
          <Select value={tripForm.routeId} onValueChange={(v) => setTripForm({...tripForm, routeId: v})}>
            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5 text-left">
              <SelectValue placeholder="Identify Vector" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-2xl p-2">
              {routes.map((r: any) => (
                <SelectItem key={r.id} value={r.id} className="rounded-xl p-3 focus:bg-indigo-600 focus:text-white">{r.startLocation} ➔ {r.endLocation}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Resource Assignment</Label>
          <Select value={tripForm.vehicleId} onValueChange={(v) => setTripForm({...tripForm, vehicleId: v})}>
            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5 text-left">
              <SelectValue placeholder="Select Fleet Unit" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-2xl p-2">
              {vehicles.map((v: any) => (
                <SelectItem key={v.id} value={v.id} className="rounded-xl p-3 focus:bg-indigo-600 focus:text-white">{v.plateNumber} ({v.capacity} Seats)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Temporal Window</Label>
          <Input type="datetime-local" className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl border-none ring-1 ring-white/5" value={tripForm.departureTime} onChange={e => setTripForm({...tripForm, departureTime: e.target.value})} required />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white hover:bg-indigo-500 h-16 rounded-[24px] font-black text-xl shadow-2xl shadow-indigo-600/20 transition-all">
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Schedule"}
      </Button>
    </form>
  );
}
