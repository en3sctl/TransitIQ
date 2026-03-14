"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Bus, 
  LayoutDashboard, 
  Users, 
  Route as RouteIcon, 
  CalendarDays, 
  Settings, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Bell
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "overview", icon: LayoutDashboard, label: 'Merkezi Kontrol' },
    { id: "vehicles", icon: Bus, label: 'Araç Filosu' },
    { id: "stations", icon: RouteIcon, label: 'İstasyonlar' },
    { id: "routes", icon: RouteIcon, label: 'Rota Havuzu' },
    { id: "trips", icon: CalendarDays, label: 'Sefer Takvimi' },
    { id: "drivers", icon: Users, label: 'Sürücü Paneli' },
  ];

  const secondaryItems = [
    { id: "billing", icon: CreditCard, label: 'Ödemeler' },
    { id: "notifications", icon: Bell, label: 'Bildirimler' },
    { id: "settings", icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <aside className="w-80 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800 flex flex-col transition-colors duration-500">
      {/* Branding */}
      <div className="p-8 pb-4">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center font-bold text-white shadow-lg transition-all group-hover:scale-105 active:scale-95">T</div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter leading-none text-zinc-900 dark:text-zinc-100 uppercase">TransitIQ</span>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1.5 ml-0.5 whitespace-nowrap">Enterprise System</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {/* Main Nav */}
        <nav className="space-y-1">
          <p className="px-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Ana Menü</p>
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-3 text-[13px]">
                <item.icon className={`w-[18px] h-[18px] transition-all ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400 outline-offset-4 outline outline-indigo-500/10 rounded' : 'text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400'}`} />
                {item.label}
              </div>
              {activeTab === item.id && <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-700" />}
            </button>
          ))}
        </nav>

        {/* Support & System */}
        <nav className="space-y-1">
          <p className="px-4 text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-4">Sistem</p>
          {secondaryItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 text-[13px]">
                <item.icon className="w-[18px] h-[18px] text-zinc-400 group-hover:text-zinc-600" />
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        {/* Tenant Status */}
        <div className="px-2 pt-2">
           <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-3xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Full Access</span>
                <span className="text-[11px] font-bold text-emerald-600/70 dark:text-emerald-400/50 truncate max-w-[130px]">{user?.tenantId}</span>
              </div>
           </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-100 mt-auto">
        <div className="flex items-center justify-between p-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[15px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold text-sm">
              {user?.name?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 truncate tracking-tight">{user?.name}</span>
              <span className="text-[11px] text-zinc-400 font-bold truncate tracking-tight">{user?.email}</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all group"
        >
          <LogOut className="w-[18px] h-[18px] transition-transform group-hover:-translate-x-1" />
          Sistemden Ayrıl
        </button>
      </div>
    </aside>
  );
}
