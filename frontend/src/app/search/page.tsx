import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const originId = params.originId as string;
  const destinationId = params.destinationId as string;
  const dateStr = params.date as string;

  // Mock Trip Data (aligned to common standard)
  const mockTrips = [
    {
      id: "1",
      departureTime: "10:00",
      arrivalTime: "15:30",
      duration: "5s 30dk",
      busType: "2+1 VIP",
      busModel: "Mercedes-Benz Travego",
      price: 450,
      availableSeats: 12,
      origin: "İstanbul",
      destination: "Ankara"
    },
    {
      id: "2",
      departureTime: "13:30",
      arrivalTime: "20:00",
      duration: "6s 30dk",
      busType: "2+2 Standart",
      busModel: "Setra S 516 HDX",
      price: 380,
      availableSeats: 5,
      origin: "İstanbul",
      destination: "Ankara"
    },
    {
      id: "3",
      departureTime: "22:00",
      arrivalTime: "03:30",
      duration: "5s 30dk",
      busType: "2+1 VIP",
      busModel: "MAN Lion's Coach",
      price: 480,
      availableSeats: 20,
      origin: "İstanbul",
      destination: "Ankara"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      {/* Header / Navbar style summary */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Geri Dön</span>
          </Link>
          
          <div className="flex flex-col items-center text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Gidiş Seferleri
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '23 Mart 2026'}
            </p>
          </div>

          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-zinc-400">
          <span>Toplam {mockTrips.length} Sefer Bulundu</span>
        </div>

        {/* Trips List */}
        <div className="flex flex-col gap-4">
          {mockTrips.map((trip) => (
            <div 
              key={trip.id}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center gap-6 justify-between"
            >
              <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{trip.departureTime}</span>
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1">{trip.origin}</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1 relative">
                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold">{trip.duration}</span>
                  <div className="h-0.5 w-full bg-slate-200 dark:bg-zinc-800 relative flex items-center justify-center">
                    <div className="absolute right-0 w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500" />
                    <div className="absolute left-0 w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500" />
                    <Clock className="absolute w-4 h-4 text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-0.5" />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{trip.arrivalTime}</span>
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1">{trip.destination}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/50 px-4 py-3 rounded-xl w-full md:w-auto">
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-block text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full mb-1">
                    {trip.busType}
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">{trip.busModel}</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-zinc-800">
                <div className="text-left md:text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">₺{trip.price}</span>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Son {trip.availableSeats} Koltuk!</p>
                </div>
                <Button className="bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold px-6 py-5 rounded-xl shadow-sm">
                  Koltuk Seç
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
