import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Receipt, Clock, User, Bell, ChevronRight, Bus } from "lucide-react";

export default function DriverView() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Mehmet Captain</h2>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">On Duty • VH-420</p>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-neutral-400" />
          <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-neutral-950" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-24">
        {/* Next Trip Card */}
        <div className="mb-8">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Active Route</p>
          <div className="p-8 rounded-[40px] bg-indigo-600 shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
             {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">Departure 14:30</span>
                <span className="text-sm font-bold flex items-center gap-2"><Bus className="w-4 h-4" /> TRXP-9942</span>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-white ring-4 ring-white/20" />
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-white to-transparent opacity-20 my-1" />
                  </div>
                  <div className="-mt-1">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none mb-1">Origin</p>
                    <p className="text-xl font-extrabold">Antalya Terminal</p>
                  </div>
                </div>

                <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-white/50" />
                  </div>
                  <div className="-mt-1">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none mb-1">Destination</p>
                    <p className="text-xl font-extrabold">Fethiye Center</p>
                  </div>
                </div>
              </div>

              <Button className="mt-10 w-full h-14 bg-white text-indigo-600 hover:bg-neutral-100 rounded-3xl font-black text-lg transition-transform active:scale-95 shadow-xl">
                Start Trip
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-[32px] bg-neutral-900 border border-neutral-800 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-amber-500" />
            </div>
            <p className="font-bold text-sm">Add Expense</p>
          </div>
          <div className="p-6 rounded-[32px] bg-neutral-900 border border-neutral-800 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-bold text-sm">Log Location</p>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 h-24 bg-neutral-950/80 backdrop-blur-xl border-t border-neutral-900 flex items-center justify-around px-8 z-50">
        <div className="p-3 text-indigo-500">
          <Bus className="w-7 h-7" />
        </div>
        <div className="p-3 text-neutral-600">
          <Clock className="w-7 h-7" />
        </div>
        <div className="p-3 text-neutral-600">
          <Navigation className="w-7 h-7" />
        </div>
        <div className="p-3 text-neutral-600">
          <User className="w-7 h-7" />
        </div>
      </nav>
    </div>
  );
}
