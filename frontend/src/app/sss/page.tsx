"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ContentPage, FaqItem } from "@/components/content-page";

const FAQ_GROUPS = [
  {
    title: 'Bilet Alma',
    items: [
      {
        q: 'Nasıl bilet alabilirim?',
        a: (
          <>
            Ana sayfada kalkış ve varış şehrini seç, tarih belirle, &quot;Bilet Bul&quot; butonuna bas.
            Uygun seferleri görüp koltuk seçip ödeme yapabilirsin. İşlem 2-3 dakika sürer.
          </>
        ),
      },
      {
        q: 'Hesap açmadan bilet alabilir miyim?',
        a: 'Evet. Misafir olarak ödeme yapıp bileti email\'ine alabilirsin. Daha sonra "Biletimi Bul" sayfasından PNR ve email ile biletini görebilirsin.',
      },
      {
        q: 'Tek seferde kaç bilet alabilirim?',
        a: 'Bir işlemde en fazla 5 koltuk için bilet alabilirsin. Her koltuk için ayrı yolcu bilgisi (TC, ad, soyad) girmen gerekir.',
      },
      {
        q: 'Fiyatlar neden değişiyor?',
        a: 'Her otobüs firması kendi fiyatını belirler. Sezon, talep, kalkış saati fiyatı etkiler. Aynı güzergah için farklı firmaların farklı fiyatları olur.',
      },
    ],
  },
  {
    title: 'Ödeme',
    items: [
      {
        q: 'Hangi ödeme yöntemlerini kullanabilirim?',
        a: 'Kredi kartı, banka kartı ve Iyzico destekli tüm kartlar. Kart bilgileriniz sunucularımızda saklanmaz, PCI-DSS sertifikalı Iyzico tarafından güvenle işlenir.',
      },
      {
        q: '3D Secure zorunlu mu?',
        a: 'Kartınız 3D Secure destekliyse otomatik olarak devreye girer. Güvenlik için 3D Secure\'ü açık tutmanızı öneririz.',
      },
      {
        q: 'Ödeme sonrası bilet nereye gelir?',
        a: 'Ödeme onaylandığında otomatik olarak: (1) ekranda PNR ve QR kod gösterilir, (2) email\'inize PDF bilet gelir, (3) hesabınıza kayıtlıysa \"Biletlerim\" sayfasında görünür.',
      },
    ],
  },
  {
    title: 'İptal ve İade',
    items: [
      {
        q: 'Biletimi nasıl iptal edebilirim?',
        a: (
          <>
            Kayıtlıysan <Link href="/hesap/biletlerim" className="text-indigo-600 underline">Biletlerim</Link>&apos;den, misafirsen{' '}
            <Link href="/bilet-takip" className="text-indigo-600 underline">Bilet Takibi</Link> sayfasından PNR ile giriş yap ve &quot;İptal Et&quot; butonuna bas.
          </>
        ),
      },
      {
        q: 'Para ne zaman iade edilir?',
        a: 'Kalkışa 6 saatten fazla süre varsa iptal sırasında Iyzico\'ya otomatik iade talebi gönderilir. Kartınıza 3-7 iş günü içinde yansır.',
      },
      {
        q: 'Kalkışa 6 saatten az varsa ne olur?',
        a: (
          <>
            Otomatik iade yapılmaz. Destek ekibiyle iletişime geçersen (<a href="mailto:destek@transitiq.com" className="text-indigo-600 underline">destek@transitiq.com</a>) durumu değerlendiririz.
          </>
        ),
      },
    ],
  },
  {
    title: 'Yolculuk',
    items: [
      {
        q: 'Kalkışta ne getirmeliyim?',
        a: 'Kimliğiniz (T.C. kimlik kartı veya pasaport) ve biletinizin çıktısı / QR kodu. Telefondan göstermek de yeterli olur.',
      },
      {
        q: 'Sefer saatinden kaç dakika önce otogarda olmalıyım?',
        a: 'En az 15 dakika önce kalkış noktasında hazır bulununuz. Pik saatlerde ve uzak otogarlarda 30 dakika güvenli olur.',
      },
      {
        q: 'Bagaj hakkım nedir?',
        a: 'Standart bagaj hakkı 15-20 kg arası, firmaya göre değişir. Aşırı veya değerli bagajları kontrol edin. El çantası ve kişisel eşyalar serbesttir.',
      },
      {
        q: 'Koltuğumu değiştirebilir miyim?',
        a: 'Bilet aldıktan sonra koltuk değişikliği şu an desteklenmiyor. İptal edip yeniden almalısınız (iade kuralları geçerli).',
      },
    ],
  },
  {
    title: 'Hesap',
    items: [
      {
        q: 'Şifremi unuttum ne yapmalıyım?',
        a: (
          <>
            Şifre sıfırlama akışı yakında eklenecek. Şu an için <a href="mailto:destek@transitiq.com" className="text-indigo-600 underline">destek@transitiq.com</a> adresine yazarak yardım alabilirsin.
          </>
        ),
      },
      {
        q: 'Hesabımı silebilir miyim?',
        a: (
          <>
            Evet. <a href="mailto:kvkk@transitiq.com" className="text-indigo-600 underline">kvkk@transitiq.com</a> adresine yazarak hesabının ve verilerinin silinmesini talep edebilirsin (KVKK kapsamında).
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState('');

  const filtered = FAQ_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !query.trim() || i.q.toLowerCase().includes(query.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  return (
    <ContentPage
      eyebrow="Yardım"
      title="Sıkça Sorulan Sorular"
      subtitle="Merak ettiklerinizi hızlıca öğrenin. Aradığınızı bulamazsanız bize yazın."
      crumbs={[{ label: 'SSS' }]}
    >
      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Soru ara..."
          className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-base font-semibold focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all"
        />
      </div>

      {/* Groups */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">&quot;{query}&quot; için sonuç bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filtered.map((group) => (
            <div key={group.title}>
              <h2 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white mb-3">{group.title}</h2>
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <FaqItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl text-center">
        <h3 className="text-2xl font-black tracking-tighter mb-2">Sorunuzun cevabı yok mu?</h3>
        <p className="text-indigo-100 font-medium text-sm mb-5">Destek ekibimiz her mesajı okur ve 1 iş günü içinde yanıtlar.</p>
        <Link href="/iletisim" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:scale-[1.02] transition-transform">
          Bize Yaz →
        </Link>
      </div>
    </ContentPage>
  );
}
