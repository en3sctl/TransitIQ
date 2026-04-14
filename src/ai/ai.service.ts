import { Injectable, Logger } from '@nestjs/common';
import { VehiclesService } from '../vehicles/vehicles.service';
import { RoutesService } from '../routes/routes.service';
import { TripsService } from '../trips/trips.service';
import { PrismaService } from '../common/prisma/prisma.service';

export interface ChatAction {
  type: 'link' | 'search' | 'phone' | 'email';
  label: string;
  value: string;
}

export interface ChatReply {
  text: string;
  actions?: ChatAction[];
  suggestions?: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private vehiclesService: VehiclesService,
    private routesService: RoutesService,
    private tripsService: TripsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Public passenger-facing chatbot.
   * Intent-based NLU with curated responses + optional action buttons.
   * Later can be upgraded to LLM via OPENAI_API_KEY / ANTHROPIC_API_KEY env.
   */
  async chat(message: string): Promise<ChatReply> {
    const m = (message || '').toLowerCase().trim();
    if (!m) return this.reply('Sana nasıl yardım edebilirim?', undefined, this.defaultSuggestions());

    // Greeting
    if (/\b(merhaba|selam|selamın aleyküm|günaydın|iyi akşamlar|hello|hi)\b/.test(m)) {
      return this.reply(
        'Merhaba! Ben TransitIQ asistanıyım. Bilet arama, iptal, iade ve seyahat hakkında yardımcı olabilirim.',
        undefined,
        this.defaultSuggestions(),
      );
    }

    // City-pair detection for ticket search
    const cities = this.extractCities(m);
    if (cities.from && cities.to) {
      return this.reply(
        `${this.capitalize(cities.from)} → ${this.capitalize(cities.to)} seferleri aranıyor. Aşağıdan tarihi seç, uygun seferleri listeleyeyim.`,
        [{ type: 'search', label: `${this.capitalize(cities.from)} → ${this.capitalize(cities.to)} Ara`, value: `/search?from=${encodeURIComponent(cities.from)}&to=${encodeURIComponent(cities.to)}` }],
      );
    }

    // Buy ticket intent
    if (/\b(bilet|seyahat|yolculuk|sefer)\b/.test(m) && /\b(al|almak|satın|arıyo|bul)\b/.test(m)) {
      return this.reply(
        'Bilet almak için ana sayfadan kalkış ve varış şehrini seçmen yeterli. İstersen hemen oraya yönlendireyim.',
        [{ type: 'link', label: 'Bilet Ara', value: '/' }],
      );
    }

    // Find my ticket (PNR)
    if (/\b(pnr|biletim|bileti bul|bilet takip|e-?posta gelmedi)\b/.test(m)) {
      return this.reply(
        'PNR kodun ve e-posta adresinle biletini hemen görebilirsin. "Bilet Takibi" sayfasına geçelim.',
        [{ type: 'link', label: 'Bilet Takibi', value: '/bilet-takip' }],
      );
    }

    // Cancel
    if (/\b(iptal|vazgeç|iptal etmek)\b/.test(m)) {
      return this.reply(
        'İptal için: kayıtlıysan "Biletlerim"den, misafirsen "Bilet Takibi" sayfasından PNR ile giriş yapıp "İptal Et" butonuna basman yeterli. Kalkışa 6 saatten fazla kaldıysa para otomatik iade edilir.',
        [
          { type: 'link', label: 'Biletlerim', value: '/hesap/biletlerim' },
          { type: 'link', label: 'Bilet Takibi', value: '/bilet-takip' },
        ],
      );
    }

    // Refund
    if (/\b(iade|para iadesi|geri ödeme|refund)\b/.test(m)) {
      return this.reply(
        'İade politikası: kalkışa 6 saatten fazla süre varsa Iyzico üzerinden otomatik iade yapılır ve kartına 3-7 iş gününde yansır. 6 saatten az süre varsa destekle iletişime geç.',
        [{ type: 'link', label: 'İade Politikası', value: '/iade-politikasi' }],
      );
    }

    // Payment
    if (/\b(ödeme|kart|kredi kartı|banka kartı|3d secure|iyzico|güvenli)\b/.test(m)) {
      return this.reply(
        'Tüm ödemeler PCI-DSS sertifikalı Iyzico altyapısıyla yapılır. Kart bilgilerin sunucumuzda saklanmaz. Kredi, banka ve Iyzico destekli tüm kartlar kabul edilir. 3D Secure otomatik devreye girer.',
      );
    }

    // Luggage
    if (/\b(bagaj|valiz|eşya|kilo)\b/.test(m)) {
      return this.reply(
        'Standart bagaj hakkı firmaya göre 15-20 kg arasıdır. El çantası ve kişisel eşyalar serbesttir. Aşırı/değerli bagaj için firma ile önceden iletişime geçmeni öneririm.',
      );
    }

    // Routes / popular
    if (/\b(rota|güzergah|nereler|şehir|hangi yerler)\b/.test(m)) {
      return this.reply(
        'Tüm rotalarımızı şehir arama özelliğiyle görebilirsin. En popüler güzergahlarımız ve fiyatları liste halinde mevcut.',
        [{ type: 'link', label: 'Tüm Rotalar', value: '/rotalar' }],
      );
    }

    // Contact / support
    if (/\b(destek|iletişim|yardım|ulaş|whatsapp|telefon|e-?posta)\b/.test(m)) {
      return this.reply(
        'Destek ekibimiz 7/24 ulaşılabilir. WhatsApp: +48 881 730 681, E-posta: destek@transitiq.com',
        [
          { type: 'phone', label: 'WhatsApp', value: 'https://wa.me/48881730681' },
          { type: 'email', label: 'E-posta', value: 'mailto:destek@transitiq.com' },
          { type: 'link', label: 'İletişim Formu', value: '/iletisim' },
        ],
      );
    }

    // Account
    if (/\b(hesap|şifre|giriş|kayıt|login|register|password)\b/.test(m)) {
      return this.reply(
        'Hesabın yoksa hızlıca kayıt olabilir, varsa giriş yapabilirsin. Şifreni unuttuysan destek ile iletişime geç.',
        [
          { type: 'link', label: 'Giriş Yap', value: '/login' },
          { type: 'link', label: 'Kayıt Ol', value: '/register' },
        ],
      );
    }

    // About
    if (/\b(transitiq|firma|hakkında|kim|neden|kurucu)\b/.test(m)) {
      return this.reply(
        'TransitIQ, 2026\'da İstanbul\'da kurulan bir şehirlerarası otobüs bileti ve filo yönetim platformudur. Modern web standartlarıyla yolcu deneyimini yeniden tasarlıyoruz.',
        [{ type: 'link', label: 'Hakkımızda', value: '/hakkimizda' }],
      );
    }

    // FAQ fallback
    if (/\b(soru|merak|bilgi|nasıl|neden|nedir)\b/.test(m)) {
      return this.reply(
        'Sık sorulan tüm sorulara SSS sayfamızdan ulaşabilirsin. Aradığın yoksa bana yaz, yardımcı olayım.',
        [{ type: 'link', label: 'Sıkça Sorulanlar', value: '/sss' }],
      );
    }

    // Thanks
    if (/\b(teşekkür|sağol|thanks|eyvallah)\b/.test(m)) {
      return this.reply('Rica ederim! Başka bir sorun olursa buradayım. İyi yolculuklar!');
    }

    // Default fallback
    return this.reply(
      'Bunu tam anlayamadım ama destek ekibimiz yardımcı olabilir. Aşağıdaki seçeneklerden birini deneyebilirsin:',
      [
        { type: 'link', label: 'SSS', value: '/sss' },
        { type: 'link', label: 'İletişim', value: '/iletisim' },
      ],
      this.defaultSuggestions(),
    );
  }

  private extractCities(m: string): { from?: string; to?: string } {
    const cities = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya', 'gaziantep', 'trabzon', 'samsun', 'eskişehir', 'kayseri', 'mersin', 'diyarbakır', 'şanlıurfa', 'kocaeli', 'sakarya', 'manisa', 'balıkesir', 'van'];
    const normalized = m.replace(/[^\wğüşıöçâî\s]/gi, ' ');
    const found = cities.filter((c) => normalized.includes(c));
    if (found.length >= 2) return { from: found[0], to: found[1] };
    return {};
  }

  private capitalize(s: string) {
    return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
  }

  private defaultSuggestions(): string[] {
    return [
      'İstanbul Ankara bileti arıyorum',
      'Biletimi nasıl iptal ederim?',
      'Ödeme güvenli mi?',
      'Bagaj hakkım ne kadar?',
    ];
  }

  private reply(text: string, actions?: ChatAction[], suggestions?: string[]): ChatReply {
    return { text, actions, suggestions };
  }

  /**
   * Suggests a ticket price based on route distance and vehicle fuel consumption.
   * Uses a mock LLM integration.
   */
  async suggestTicketPrice(tenantId: string, routeId: string, vehicleId: string) {
    const route = await this.routesService.findOne(tenantId, routeId);
    const vehicle = await this.vehiclesService.findOne(tenantId, vehicleId);

    const distance = route.totalDistanceKm;
    const consumption = 10; // Mocked: fuelConsumptionPer100km removed from schema

    this.logger.log(`Generating AI price suggestion for Route: ${routeId}, Vehicle: ${vehicleId}`);

    // Mock LLM Prompt Simulation
    const prompt = `
      Route Distance: ${distance} km
      Vehicle Fuel Consumption: ${consumption} L/100km
      Current Fuel Price (Estimated): 40 TRY/L
      Task: Calculate total fuel cost and suggest a ticket price with a 30% profit margin and 20 seats capacity.
    `;

    // Simulate LLM Call Delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulated LLM Response
    const fuelNeeded = (distance * consumption) / 100;
    const fuelCost = fuelNeeded * 40;
    const suggestedTotal = fuelCost * 1.3;
    const recommendedPrice = Math.ceil(suggestedTotal / 20);

    return {
      recommendedPrice,
      currency: 'TRY',
      reasoning: `Based on ${consumption}L/100km consumption over ${distance}km, total fuel cost is ~${fuelCost.toFixed(2)} TRY. With a 30% margin and 20 seats, the recommended price is ${recommendedPrice} TRY.`,
      metadata: {
        distance,
        consumption,
        fuelCostEstimate: fuelCost,
      },
    };
  }

  /**
   * Optimizes a trip route by suggesting detour for extra pickups.
   * Uses a mock LLM integration.
   */
  async optimizeRouteForPickups(tenantId: string, tripId: string) {
    const trip = await this.tripsService.findOne(tenantId, tripId);

    this.logger.log(`Optimizing route for Trip: ${tripId}`);

    // Mocking finding unassigned passengers along the way
    const unassignedCount = Math.floor(Math.random() * 5) + 1;

    // Simulate LLM Call Delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulated LLM Response
    return {
      detourRecommended: true,
      extraDistanceKm: 12.5,
      addedPassengers: unassignedCount,
      newEstimatedTime: 'Adds ~20 minutes to arrival',
      reasoning: `Found ${unassignedCount} passengers near the main highway. A 12.5km detour will increase revenue by ~${unassignedCount * 200} TRY with minimal delay.`,
    };
  }
}
