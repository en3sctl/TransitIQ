import { Button } from "@/components/ui/button";
import { MoveRight, MapPin, Calendar, Users } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 overflow-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            T
          </div>
          <span className="text-xl font-bold tracking-tight">TransitIQ</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#" className="hover:text-neutral-50 transition-colors">Routes</a>
          <a href="#" className="hover:text-neutral-50 transition-colors">Pricing</a>
          <a href="#" className="hover:text-neutral-50 transition-colors">About</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm rounded-xl">Login</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm shadow-lg shadow-indigo-500/20">Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-3 duration-1000">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              New Routes Available
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-75">
              Book your next trip <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">with TransitIQ.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150 leading-relaxed">
              Experience the future of transportation. Secure your seat on premium intercity routes with AI-optimized pricing and real-time tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 h-14 px-8 rounded-2xl text-base font-semibold group shadow-xl shadow-indigo-500/25">
                Book a Ticket <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:bg-neutral-800 h-14 px-8 rounded-2xl text-base font-semibold">
                View Routes
              </Button>
            </div>
          </div>

          {/* Quick Booking Bar */}
          <div className="mt-20 p-2 rounded-[28px] bg-neutral-900/40 border border-neutral-800/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-1000 delay-500 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/50 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  From
                </div>
                <div className="text-sm font-semibold text-neutral-200">New York, NY</div>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/50 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  To
                </div>
                <div className="text-sm font-semibold text-neutral-200">Boston, MA</div>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/50 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 text-neutral-500 mb-1 font-medium text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  Date
                </div>
                <div className="text-sm font-semibold text-neutral-200">Select Date</div>
              </div>
              <div className="bg-indigo-600 hover:bg-indigo-500 p-4 rounded-2xl flex items-center justify-center transition-all cursor-pointer select-none ring-1 ring-indigo-400/50 shadow-lg shadow-indigo-600/30">
                <span className="font-bold text-white tracking-wide">Search Trips</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-neutral-900 max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8 text-neutral-500 text-sm">
        <div className="flex items-center gap-2 grayscale brightness-50">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center font-bold text-black text-xs">
            T
          </div>
          <span className="font-bold tracking-tight">TransitIQ</span>
        </div>
        <div className="flex items-center gap-12">
          <a href="#" className="hover:text-neutral-50 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-neutral-50 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-neutral-50 transition-colors">Contact</a>
        </div>
        <div>© 2026 TransitIQ Inc.</div>
      </footer>
    </div>
  );
}
