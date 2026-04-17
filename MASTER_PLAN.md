# TransitIQ — Master Plan

**Son güncelleme:** 2026-04-16
**Kurucu:** Enes Çatal
**Merkez:** İstanbul, Türkiye
**Durum:** Private beta, üretime hazırlık fazı

Bu doküman TransitIQ'nun hedefini, mimarisini, özellik envanterini ve roadmap'ini kapsar. Her sprint sonrası güncellenir; bir özellik "complete" olarak işaretlenmeden önce bu dokümanda checkbox'ı işaretlenmiş olmalı.

---

## 1. Vizyon ve Farklılaşma

### 1.1 Vizyon
Türkiye'nin şehirlerarası otobüs seyahati pazarında, **yolcuya Obilet'ten daha iyi bir deneyim** ve **firmalara Enuygun'dan daha modern bir SaaS** sunarak, sektörün dijital altyapı standardı olmak.

### 1.2 Rakip Analizi

| Özellik | Obilet | Enuygun | Neredennereye | **TransitIQ Hedef** |
|---|---|---|---|---|
| Sefer arama | ✓ | ✓ | ✓ | ✓ + aktarmalı öneriler |
| Canlı sefer takibi | ✗ | ✗ | ✗ | **✓ (büyük farklılaştırıcı)** |
| Real-time koltuk viewer count | ✗ | ✗ | ✗ | **✓ (Booking.com FOMO)** |
| Fiyat alarmı | ✗ | ✗ | ✗ | **✓ (Hopper tarzı)** |
| Fiyat geçmişi grafiği | ✗ | ✗ | ✗ | **✓** |
| Karbon ayak izi | ✗ | ✗ | ✗ | **✓ (Z kuşağı için)** |
| Dijital cüzdan | ✗ | Kısmen | ✗ | **✓** |
| Referans programı | ✗ | ✗ | ✗ | **✓ (50₺/50₺)** |
| Rozet / gamification | ✗ | ✗ | ✗ | **✓** |
| Aktarmalı seyahat | ✗ | Manuel | ✗ | **✓ (otomatik öneri)** |
| Grup koltuk eşleştirme | Kısmen | Kısmen | ✗ | **✓ (tek tık 2+li)** |
| AI chatbot asistanı | ✗ | ✗ | ✗ | **✓** |
| Şoför GPS push | ✗ | ✗ | ✗ | **✓** |
| QR check-in (şoför) | Kısmen | ✗ | ✗ | **✓ (native BarcodeDetector)** |
| Yolcu manifest + boarding | Kısmen | ✗ | ✗ | **✓** |
| PWA + offline bilet | ✗ | ✗ | ✗ | Planned (Faz 3) |
| Apple/Google Wallet pass | ✗ | ✗ | ✗ | Planned (Faz 3) |
| Push notifications | Kısmen | ✗ | ✗ | Planned (Faz 3) |
| Multi-tenant SaaS (firma paneli) | ✗ | ✗ | ✗ | **✓ (B2B gelir modeli)** |
| Denetim logu (audit trail) | ✗ | ✗ | ✗ | **✓ (kurumsal satış için şart)** |
| Dinamik fiyat kuralları | ✗ | ✗ | ✗ | Planned |
| KVKK self-servis veri silme | Kısmen | Kısmen | Kısmen | **✓ (ürün içinde)** |

### 1.3 Differentiation Pitch (3 cümle)
> TransitIQ, yolculara **otobüsün nerede olduğunu haritada canlı gösteren**, **fiyat düşünce otomatik haber veren**, **aktarmalı rotalarda kurtaran** tek Türk platform. Otobüs firmalarına ise **SOC-2 hazırlıklı altyapı, denetim logu, multi-tenant yönetim paneli ve gerçek zamanlı operasyon araçları** sunar. Obilet rezervasyon servisidir — TransitIQ **ulaşım zekası** platformudur.

---

## 2. Kullanıcı Personaları

### 2.1 Yolcu (B2C) — `PASSENGER`
- **Mehmet, 34, Bursa'dan İstanbul'a düzenli iş seyahati yapan satış müdürü.**
- Hızlı, güvenli ödeme ister. Biletini WhatsApp'tan arkadaşıyla paylaşır. Otobüs geç kalırsa haber almak ister.
- **Ne bekler:** 60 sn içinde arama→ödeme, biletini telefonda açabilme, iptal/iade stres olmasın.

### 2.2 Firma Admin (B2B) — `COMPANY_ADMIN`
- **Ayşe, 45, "Kent Seyahat" otobüs firması operasyon müdürü.**
- Filosunu, şoförlerini, seferleri yönetir. Günlük ciroyu görmek, iptalleri takip etmek ister. Hangi şoförün hangi sefere atandığını bilmek, muayene/sigorta tarihleri yaklaşınca hatırlatılmak ister.
- **Ne bekler:** Dashboard → tek ekranda operasyon. Mobil de çalışsın. Denetim için log ister.

### 2.3 Şoför — `DRIVER`
- **Kamil, 52, 25 yıllık profesyonel şoför.**
- Teknoloji düşmanı değil ama fazla buton görmek istemiyor. Bugünün seferi belli olsun, yolcularını görebilsin, QR ile çabuk check-in yapsın.
- **Ne bekler:** Telefonda tek dokunuşla sefer başlat, yolcu listesi göreyim, sıkıntı olursa admin'e ulaşayım.

### 2.4 Operatör (gelecek) — `OPERATOR`
- Firma admin'in kısıtlı yetkili versiyonu. Bilet satış/iptal yapar, finansa dokunmaz.

### 2.5 Süper Admin — `SUPER_ADMIN`
- Platform sahibi (Enes). Tüm tenant'ları yönetir. Yeni firma onaylar, global durumu izler.

---

## 3. Özellik Envanteri

Her özellik için: ✅ tamamlandı · 🟡 kısmen · ⏳ planlı · ❌ henüz yok

### 3.1 Yolcu Tarafı
- ✅ Sefer arama (şehir, tarih)
- ✅ Rota bazlı public sayfa (/rotalar)
- ✅ Koltuk seçimi (interaktif harita, layout-aware)
- ✅ Real-time koltuk — **WebSocket** ile viewer count, başka kullanıcının hover ettiği koltuk göstergesi
- ✅ Koltuk kilitleme (10 dk)
- ✅ Grup koltuk önerisi (2/3/4 kişi tek tık)
- ✅ Aktarmalı seyahat finder (10 hub üzerinden otomatik)
- ✅ Iyzico ile ödeme (3D Secure, kart saklamadan)
- ✅ PDF bilet + email (CID inline logo)
- ✅ PNR+email ile misafir bilet takibi (`/bilet-takip`)
- ✅ Müşteri hesabı (kayıt, giriş, profil)
- ✅ Biletlerim (gelecek/geçmiş/iptal)
- ✅ Bilet iptal + otomatik Iyzico iade (6 saat kuralı)
- ✅ Canlı sefer takibi — şoför GPS'i ile harita üzerinde otobüs konumu
- ✅ WhatsApp bilet paylaşımı (her bilette buton)
- ✅ AI chatbot (12+ intent, aksiyon butonlu)
- ✅ Dijital cüzdan (kredi bakiyesi + işlem geçmişi)
- ✅ Referans kodu sistemi (50₺+50₺ bonus, otomatik URL param)
- ✅ Fiyat alarmları (email/SMS seçeneği, CRUD)
- ✅ Fiyat geçmişi grafiği (30 gün, verdict: iyi/ortalama/yüksek)
- ✅ Karbon ayak izi karşılaştırma (otobüs vs araba/uçak/tren)
- ✅ Rozet sistemi (8 rozet, otomatik evaluation)
- ✅ Landing: popüler rotalar (foto zeminli), ucuz seferler, "Türkiye'yi Keşfet" editorial, canlı metrikler
- ✅ Hero carousel (18 Türk landmark fotoğrafı)
- ✅ Hesap sayfası sol navigasyon (biletler, cüzdan, alarm, rozet, davet, profil)
- ✅ Cross-tab session sync
- ⏳ PWA + installable + offline bilet
- ⏳ Push notifications (sefer hatırlatma)
- ⏳ Apple Wallet / Google Wallet bilet pass
- ⏳ Fiyat geçmişi grafiğinde günlük trend çizgisi
- ⏳ Koltuk tercihi profilde (pencere/koridor)
- ⏳ Erişilebilirlik notu (tekerlekli sandalye, refakatçi)
- ⏳ Bekleme listesi (sefer dolu → boşalınca bildir)
- ⏳ Bilet devretme (başkasına transfer)
- ❌ Dark mode için foto carousel optimizasyonu (şu an parlak)
- ❌ Multi-language (EN/AR/DE — turist pazarı için)

### 3.2 Şoför Tarafı
- ✅ Rol tabanlı login (`/login` → role göre yönlendirme)
- ✅ Günün + yaklaşan 7 günün seferleri (sıralı)
- ✅ Seferi Başlat / Tamamla
- ✅ Sefer ACTIVE iken otomatik GPS push (20sn, watchPosition)
- ✅ Yolcu manifestosu (koltuk, ad, TC son 4, telefon, status)
- ✅ Check-in (QR tara VEYA elle PNR gir)
- ✅ No-show işaretleme
- ✅ Boarding status reset (undo)
- ✅ Araç bilgisi (plaka, model)
- ⏳ Şoför profil sayfası (kendi şifresini değiştirme)
- ⏳ Şoför istatistikleri (toplam sefer, doluluk ort, puan)
- ⏳ Acil durum / SOS butonu (admin'e direkt bildirim)
- ⏳ Sefer öncesi araç kontrol formu (yakıt, lastik, iç temizlik)
- ⏳ Gün sonu rapor (kaç yolcu bindi, kaç iade, kaç gelmedi)
- ⏳ Rota sapma uyarısı (belirlenen rotadan çıktığında admin'e bildirim)
- ⏳ İkinci şoför vardiya devri

### 3.3 Firma Admin Tarafı
- ✅ Login (rol kontrolü ile)
- ✅ Genel bakış (stat kartları)
- ✅ Filo yönetimi (araç CRUD, soft delete)
- ✅ İstasyon yönetimi (CRUD)
- ✅ Rota yönetimi (CRUD, otomatik fiyat + mesafe)
- ✅ Sefer yönetimi (CRUD + şoför ataması)
- ✅ Sefer düzenleme (şoför/araç yeniden atama)
- ✅ Bilet yönetimi (liste, filtre, detay, iptal, iade)
- ✅ Şoför yönetimi (CRUD + şifre güncelleme)
- ✅ Denetim logu (tüm kritik mutasyonlar: kim, ne, ne zaman, before/after diff)
- ✅ Command palette (Cmd+K)
- ✅ Ciro dashboard (30 gün bar chart + bugün/hafta/ay/toplam gerçek veriler)
- ⏳ Doluluk analizi (rota bazında)
- ⏳ Tahminleme (ML ile doluluk/ciro öngörü)
- ⏳ Promosyon kodu yönetimi
- ⏳ Dinamik fiyat kuralları
- ⏳ CSV export (bilet/sefer/muhasebe)
- ⏳ Tekrarlayan sefer şablonu ("her Pazartesi 09:00")
- ⏳ OPERATOR rolü implementation (kısıtlı yetki)
- ⏳ Bulk işlem (çoklu sefer iptali vb.)
- ⏳ Müşteri segmentasyonu (VIP, düzenli, risk)

### 3.4 Süper Admin (Platform)
- ❌ Tenant onboarding akışı
- ❌ Tenant listesi / durumu
- ❌ Global analytics
- ❌ Billing / komisyon takibi
- ❌ Platform-wide duyuru gönderme

### 3.5 Site / İçerik
- ✅ Landing (hero, carousel, live ticker, popüler, keşfet, ucuz, features, B2B CTA)
- ✅ /rotalar (tüm rotalar, şehir bazında filtre)
- ✅ /fiyatlandirma (3 tier B2B + FAQ)
- ✅ /hakkimizda (dürüst, 1 kişilik ekip, 2026)
- ✅ /iletisim (form + WhatsApp +48 881 730 681)
- ✅ /sss (arama + 5 grup + 18 soru)
- ✅ /yardim (kategori kartları)
- ✅ /blog (yakında placeholder)
- ✅ /basin (boilerplate, logo download)
- ✅ /kariyer (açık pozisyon yok + gelecekteki roller)
- ✅ Yasal sayfalar: KVKK, Gizlilik, Şartlar, Çerez, İade Politikası
- ⏳ Her rota için SEO-dostu ayrı URL (/rotalar/istanbul-ankara)
- ⏳ Open Graph meta + schema.org JSON-LD
- ⏳ Sitemap.xml + robots.txt

---

## 4. Teknoloji Yığını

### 4.1 Frontend
- **Framework:** Next.js 16 (app router, Turbopack)
- **UI:** React 19, TypeScript, Tailwind CSS 4, framer-motion
- **Components:** shadcn/ui + @base-ui/react
- **State:** Zustand (booking store)
- **HTTP:** axios + interceptor (auto 401 redirect)
- **Real-time:** socket.io-client
- **Harita:** Leaflet (CDN-loaded, OpenStreetMap tiles)
- **Smooth scroll:** Lenis
- **Toasts:** sonner
- **Icons:** lucide-react
- **Dark mode:** next-themes

### 4.2 Backend
- **Framework:** NestJS
- **Dil:** TypeScript
- **ORM:** Prisma
- **DB:** PostgreSQL (Neon, serverless, eu-central-1)
- **Auth:** JWT (passport-jwt), bcrypt
- **Ödeme:** Iyzico (PCI-DSS)
- **Email:** Resend + @react-email/components
- **PDF:** PDFKit + DejaVu fonts
- **WebSocket:** @nestjs/websockets + socket.io
- **Zamanlayıcı:** @nestjs/schedule (cron)
- **Rate limit:** @nestjs/throttler
- **Validation:** class-validator

### 4.3 Harici Servisler
- ✅ Iyzico (ödeme + iade)
- ✅ Resend (email)
- ✅ Wikipedia REST API (şehir fotoları, ücretsiz)
- ✅ OpenStreetMap (harita tiles, ücretsiz)
- ⏳ Netgsm / Iletimerkezi (SMS)
- ⏳ Google Places / OSM Overpass (otogar verisi)
- ⏳ Sentry (error tracking)
- ⏳ Plausible veya Posthog (analytics)
- ⏳ Cloudflare (CDN + WAF)
- ⏳ Uptime Robot (availability)

---

## 5. Güvenlik — OWASP Top 10 Checklist

### A01 — Broken Access Control
- ✅ Her admin endpoint'inde `@UseGuards(JwtAuthGuard)`
- ✅ Her sorguda `tenantId` filtresi
- ✅ Frontend `ProtectedRoute allowedRoles={[...]}`
- ✅ Cross-tenant resource validation (trip create: route/vehicle/driver aynı tenant'tan mı)
- ⏳ IDOR testleri (BookingId ile başka tenant'ın bileti okunmamalı — scope var ama penetrasyon testi yapılmadı)
- ⏳ Şoför sadece kendi seferlerine lokasyon push edebilir — teyit edildi ✓

### A02 — Cryptographic Failures
- ✅ bcrypt 10 rounds şifreler için
- ✅ JWT signed with JWT_SECRET
- ✅ Kart bilgileri sunucuda saklanmaz (Iyzico direct)
- ⏳ HTTPS enforce (prod deployment)
- ⏳ JWT_SECRET rotation planı
- ⏳ DB-level encryption at rest (Neon sağlıyor ama audit yapılmadı)

### A03 — Injection
- ✅ Prisma → SQL injection bağışık (parametrized)
- ✅ DTO validation (class-validator)
- ⏳ NoSQL injection (yok, Postgres kullanılıyor)
- ⏳ XSS — React'te default escape var ama `dangerouslySetInnerHTML` audit yapılmadı

### A04 — Insecure Design
- ✅ 10 dakikalık seat lock (race condition engeli)
- ✅ 6 saat iptal kuralı
- ✅ Audit log (denetim izi)
- ⏳ Rate limit tüm endpoint'lerde değil (bazıları default)
- ⏳ Brute force login koruması — max 5 başarısız/dk/IP

### A05 — Security Misconfiguration
- ✅ `.env` gitignore'da
- ⏳ Helmet.js (CSP, HSTS, X-Frame-Options)
- ⏳ Prod'da stack trace gizlenmeli
- ⏳ Debug mode off

### A06 — Vulnerable Components
- ⏳ `npm audit` CI'de otomatik
- ⏳ Dependabot aktif değil

### A07 — Identification & Authentication
- ✅ Güçlü şifre (min 6, kontrol UI'da)
- ✅ JWT expiration (1 gün default)
- ⏳ 2FA (SMS/TOTP) — admin için şart
- ⏳ Şifre sıfırlama akışı
- ⏳ Email doğrulama kayıtta
- ⏳ Session revocation (logout all devices)
- ⏳ Refresh token (1gün çok kısa, session middle-click kaybedersin)

### A08 — Software & Data Integrity
- ✅ Prisma migrations versiyon kontrollü
- ⏳ SRI (subresource integrity) for CDN assets (Leaflet)

### A09 — Logging & Monitoring
- ✅ Audit log (kritik mutasyonlar)
- ⏳ Sentry error tracking
- ⏳ Access log (kimin ne zaman giriş yaptığı)
- ⏳ Suspicious activity detection

### A10 — SSRF
- ✅ Wikipedia/OSM fetch'leri User-Agent ile identified
- ⏳ Rate limit outbound HTTP çağrıları

### KVKK Compliance
- ✅ KVKK aydınlatma metni sayfası
- ✅ Çerez politikası sayfası
- ⏳ Kullanıcı kendi verisini indirme (JSON export)
- ⏳ Kullanıcı kendi hesabını silme (soft delete + 30 gün sonra hard delete)
- ⏳ Consent management (çerez banner)
- ⏳ Veri işleme kayıt defteri (DPO için)

---

## 6. Veritabanı Şeması

### 6.1 Mevcut Modeller
- `Tenant` (multi-tenant root)
- `User` (PASSENGER/DRIVER/OPERATOR/COMPANY_ADMIN/SUPER_ADMIN + wallet, referral, badges)
- `Station` (lat/lng, tenant-owned)
- `Vehicle` (plate, capacity, layout, muayene/sigorta tarihleri)
- `Seat` (vehicle-owned, status: AVAILABLE/LOCKED/BOOKED/BLOCKED)
- `Route` (origin+destination+price+distance)
- `RouteStop` (ara duraklar)
- `Trip` (+GPS fields: currentLat/Lng/Speed/lastLocationAt)
- `Booking` (+ refundStatus, boardingStatus, paymentTransactionId)
- `PendingPayment` (Iyzico callback için)
- `AuditLog` (denetim izi)
- `PriceAlert`
- `WalletTransaction`
- `PriceHistorySnapshot`

### 6.2 Eklenecek Modeller
```prisma
model MaintenanceRecord {
  id          String   @id @default(uuid())
  vehicleId   String
  type        String   // OIL_CHANGE, TIRE, INSPECTION, INSURANCE, CLEANING, OTHER
  description String?
  cost        Decimal?
  odometerAt  Int?
  performedAt DateTime
  performedBy String?  // mechanic name
  nextDueAt   DateTime?
  nextDueKm   Int?
  attachmentUrl String?
  createdAt   DateTime @default(now())

  vehicle Vehicle @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId, performedAt])
  @@map("maintenance_records")
}

model FuelLog {
  id         String   @id @default(uuid())
  vehicleId  String
  tripId     String?
  liters     Decimal
  pricePerL  Decimal
  totalCost  Decimal
  odometerAt Int
  station    String?
  fueledAt   DateTime
  fueledBy   String?

  vehicle Vehicle @relation(fields: [vehicleId], references: [id])

  @@index([vehicleId, fueledAt])
}

model PromoCode {
  id             String   @id @default(uuid())
  tenantId       String?  // null = platform-wide
  code           String   @unique
  discountType   String   // PERCENT, FIXED
  discountValue  Decimal
  minBookingAmount Decimal?
  maxUses        Int?
  usedCount      Int      @default(0)
  validFrom      DateTime
  validUntil     DateTime
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())

  applications PromoCodeApplication[]
}

model PromoCodeApplication {
  id         String   @id @default(uuid())
  promoCodeId String
  bookingId  String
  userId     String
  discountApplied Decimal
  appliedAt  DateTime @default(now())

  promoCode PromoCode @relation(fields: [promoCodeId], references: [id])
}

model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  endpoint  String   @unique
  keysJson  String
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model NotificationPreference {
  userId          String @id
  emailMarketing  Boolean @default(true)
  emailReminders  Boolean @default(true)
  smsReminders    Boolean @default(false)
  pushEnabled     Boolean @default(false)
  priceAlerts     Boolean @default(true)

  user User @relation(fields: [userId], references: [id])
}

model Complaint {
  id          String   @id @default(uuid())
  userId      String?
  bookingId   String?
  category    String   // DELAY, DRIVER, CLEANLINESS, PAYMENT, OTHER
  subject     String
  description String
  status      String   @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED
  assignedTo  String?
  resolution  String?
  createdAt   DateTime @default(now())
  resolvedAt  DateTime?
}

model Review {
  id        String   @id @default(uuid())
  bookingId String   @unique
  userId    String
  tripId    String
  driverId  String?
  rating    Int      // 1-5
  comment   String?
  tags      String[] // CLEAN, ON_TIME, FRIENDLY, COMFORTABLE
  createdAt DateTime @default(now())
}

model TripTemplate {
  id              String   @id @default(uuid())
  tenantId        String
  routeId         String
  vehicleId       String
  driverId        String
  daysOfWeek      Int[]    // [1,2,3,4,5] = weekdays
  departureTime   String   // "09:00"
  validFrom       DateTime
  validUntil      DateTime?
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
}

model SavedCard {
  id               String   @id @default(uuid())
  userId           String
  iyzicoCardToken  String   // Iyzico's tokenized card reference
  maskedPan        String   // "**** **** **** 1234"
  cardFamily       String?  // Bonus, Axess, etc.
  cardType         String?  // CREDIT_CARD, DEBIT_CARD
  expiry           String?
  createdAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

### 6.3 Eksik İndeksler
```sql
CREATE INDEX idx_trips_tenant_status_departure ON trips(tenant_id, status, departure_time);
CREATE INDEX idx_bookings_trip_status ON bookings(trip_id, status);
CREATE INDEX idx_bookings_user ON bookings(user_id, booking_time DESC);
CREATE INDEX idx_audit_timestamp ON audit_logs(tenant_id, timestamp DESC);
```

---

## 7. API Endpoint Envanteri

### 7.1 Auth
- `POST /auth/register` — company admin kayıt
- `POST /auth/login` — B2B login
- `POST /auth/customer/register` — yolcu kayıt
- `POST /auth/customer/login` — yolcu login
- `GET /auth/customer/profile` — profil oku
- `PATCH /auth/customer/profile` — profil güncelle
- `PATCH /auth/customer/password` — şifre değiştir
- `GET /auth/customer/bookings` — kendi biletleri
- `POST /auth/customer/bookings/:id/cancel` — bilet iptal (iade otomatik)
- `POST /auth/guest/ticket-lookup` — PNR+email ile misafir bilet

### 7.2 Booking & Search
- `GET /booking/search` — sefer arama
- `GET /booking/search/multi-leg` — aktarmalı
- `GET /booking/trips/:tripId/seats` — koltuk haritası
- `POST /booking/seats/lock` — 10dk kilit
- `POST /booking/reservations` — rezervasyon oluştur
- `GET /booking/ticket/:pnr` — PNR ile bilet
- `GET /booking/ticket/:pnr/live` — canlı konum (PNR+email)
- `GET /booking/tickets?pnrs=X,Y` — çoklu bilet
- `POST /booking/bookings/:id/cancel` — iptal (yolcu)
- `GET /booking/admin/bookings` — admin liste
- `POST /booking/admin/bookings/:id/cancel` — admin iptal + iade

### 7.3 Routes / Trips
- `GET /routes/public` — public rota listesi
- `GET /routes/public/popular` — popüler rotalar
- `GET /routes/public/stats` — platform istatistikleri
- `CRUD /routes` — admin rota yönetimi
- `GET /trips` — admin sefer listesi
- `POST /trips` — sefer oluştur
- `PATCH /trips/:id` — şoför/araç değiştir (reassign)
- `GET /trips/public/cheap` — ucuz seferler

### 7.4 Driver Ops
- `GET /driver-ops/trips/today` — yaklaşan seferler
- `PATCH /driver-ops/trips/:id/status` — sefer durumu
- `POST /driver-ops/trips/:id/location` — GPS push
- `GET /driver-ops/trips/:id/manifest` — yolcu listesi
- `POST /driver-ops/check-in/:pnr` — yolcu check-in
- `POST /driver-ops/no-show/:pnr` — gelmedi işaretle
- `POST /driver-ops/reset-boarding/:pnr` — undo

### 7.5 Users / Drivers
- `CRUD /users/drivers` — şoför CRUD
- `GET /stations` / `CRUD /stations`
- `GET /vehicles` / `CRUD /vehicles`

### 7.6 Passenger Features
- `GET /wallet/balance`
- `GET /wallet/transactions`
- `GET /referral/code`
- `GET /referral/stats`
- `POST /referral/apply`
- `CRUD /price-alerts` + `POST /price-alerts/:id/toggle`
- `GET /price-history?from=X&to=Y&days=N`
- `GET /badges`
- `GET /carbon?distanceKm=N`

### 7.7 AI
- `POST /ai/chat` — chatbot
- `POST /ai/suggest-price` — admin fiyat önerisi
- `GET /ai/optimize-route` — admin rota optimizasyonu

### 7.8 Utility
- `GET /city-image?city=X` — Wikipedia foto
- `GET /audit-logs` — admin denetim

### 7.9 Eklenecek Endpoint'ler
- ~~`POST /auth/password-reset/request`~~ ✅
- ~~`POST /auth/password-reset/confirm`~~ ✅
- ~~`POST /auth/verify-email/send` + `/confirm`~~ ✅
- ~~`GET /auth/google` + `/auth/google/callback`~~ ✅
- `POST /auth/2fa/enable` + `/2fa/verify` → TOTP
- `POST /user/delete-account` → KVKK self-servis
- `GET /user/data-export` → KVKK self-servis JSON export
- `CRUD /vehicles/:id/maintenance-records`
- `CRUD /vehicles/:id/fuel-logs`
- `CRUD /promo-codes` (admin)
- `POST /checkout/apply-promo` → checkout'ta indirim
- `POST /push/subscribe` — push notification subscription
- `GET/PATCH /notifications/preferences`
- `CRUD /complaints`
- `POST /reviews`
- `CRUD /trip-templates`
- `GET /stations/search-otogar?city=X` — **OSM Overpass otogar arama**
- `GET /analytics/revenue` — admin ciro dashboard
- `GET /analytics/occupancy` — rota bazlı doluluk
- `POST /export/bookings.csv` — admin CSV export
- `POST /sms/send` — internal (Netgsm)

---

## 8. Frontend Sayfa Envanteri

Mevcut:
- `/` landing
- `/search` sefer arama ve koltuk seçimi
- `/checkout` ödeme
- `/success` ödeme başarılı
- `/bilet-takip` PNR ile takip
- `/bilet-takip/[pnr]` canlı harita
- `/login` + `/register` (B2B)
- `/hesap/giris` + `/hesap/kayit` + `/hesap/biletlerim` + `/hesap/cuzdan` + `/hesap/fiyat-alarmlari` + `/hesap/rozetler` + `/hesap/davet` + `/hesap/profil`
- `/admin` (7 sekme: genel, filo, istasyon, rota, sefer, bilet, şoför, denetim)
- `/driver`
- `/rotalar`, `/fiyatlandirma`, `/hakkimizda`, `/iletisim`, `/blog`, `/basin`, `/kariyer`, `/sss`, `/yardim`, `/kvkk`, `/gizlilik`, `/sartlar`, `/cerez`, `/iade-politikasi`

Eklenecek:
- `/rotalar/[slug]` — SEO-dostu (ör. `/rotalar/istanbul-ankara`)
- ~~`/sifre-sifirla`~~ ✅
- ~~`/email-dogrula`~~ ✅
- ~~`/google-callback`~~ ✅
- `/hesap/ayarlar/guvenlik` — 2FA, aktif sessionlar
- `/hesap/ayarlar/bildirimler` — notification preferences
- `/hesap/veri-indir` — KVKK export
- `/hesap/hesap-sil` — soft delete
- `/hesap/degerlendirmeler` — yorumlarım
- `/admin/analytics` — grafikli dashboard
- `/admin/promo-kodlar`
- `/admin/sefer-sablonlari`
- `/admin/fiyat-kurallari`
- `/admin/sikayetler` — şikayet yönetimi
- `/driver/profil` — şoför profili
- `/driver/istatistikler`
- `/superadmin/*` — platform dashboard

---

## 9. Entegrasyonlar

### 9.1 Aktif
- **Iyzico** — ödeme + iade
- **Resend** — email
- **Wikipedia REST** — şehir landmark fotoları
- **OpenStreetMap** — Leaflet tiles

### 9.2 Planlanan
- **OSM Overpass API** — otogar lokasyon arama (FREE, official)
  - Query: `node["amenity"="bus_station"](area:TR);out;`
  - Endpoint: `https://overpass-api.de/api/interpreter`
- **Netgsm** veya **Iletimerkezi** — SMS
- **Google Maps Distance Matrix** — gerçek mesafe/süre
- **Sentry** — hata izleme
- **Plausible** veya **Posthog** — privacy-first analytics
- **Cloudflare** — CDN, DDoS koruması, WAF
- **AWS S3** veya **Cloudflare R2** — PDF/pass asset storage

### 9.3 Türk Araç Sorgulama (zor konu)
Türkiye'de plaka girince aracın km/muayene/sigorta bilgisi dönen **ücretsiz public API yok**:
- E-Devlet API'si TCKN doğrulaması + eimza gerektirir, platform bazlı kullanılamaz
- TRAMER (Sigorta Bilgi Merkezi) API'si sadece yetkili sigorta firmalarına açık
- Commercial alternatifler: `arackredi.com API`, `oto-sorgu.com` — ücretli, ayda ~1000₺+
- **Pratik çözüm:**
  - Admin plakayı + araç bilgilerini manuel girer (bir kerelik)
  - Muayene/sigorta tarihleri DB'de tutulur
  - Cron job 30 gün önceden admin'e bildirim gönderir
  - Km bilgisi şoför her sefer sonu girer (FuelLog + MaintenanceRecord üzerinden)
  - Opsiyonel: commercial API entegrasyonu (ileride, premium tier için)

---

## 10. Ödeme Akışı (Detaylı)

### 10.1 Aktif Kullanıcı Ödemesi
1. Yolcu koltuk seçer → `POST /booking/seats/lock` (10 dk)
2. Yolcu checkout'a ilerler → yolcu bilgilerini girer
3. Frontend `POST /payment/checkout-form` → Iyzico token alır
4. Iyzico iframe açılır, kullanıcı kart bilgilerini girer
5. 3D Secure doğrulama (eğer kart destekliyor)
6. Iyzico callback → `POST /payment/callback` → pending payment row
7. `POST /booking/reservations` → booking oluşur, koltuk BOOKED
8. Email + PDF bilet gönderilir (fire-and-forget)
9. Referral bonus + badge evaluation (fire-and-forget)
10. WebSocket broadcast seats:changed

### 10.2 İade Akışı
1. Yolcu `POST /auth/customer/bookings/:id/cancel`
2. 6 saat kuralı kontrol
3. Booking → CANCELLED, Seat → AVAILABLE
4. `paymentService.refundPayment(paymentTransactionId)` → Iyzico
5. Iyzico başarılıysa `refundStatus = REFUNDED`, değilse FAILED
6. AuditLog
7. WebSocket broadcast seats:changed (FREED)

### 10.3 Eklenecek Flow'lar
- **Cüzdan kullanımı:** Checkout'ta "Cüzdan bakiyemi kullan (max X₺)" checkbox
- **Promo kodu:** Checkout'ta kod girişi → `applyPromo` → indirim
- **Saved card:** "Kayıtlı kartla öde" → 3DS atlanır
- **Split payment:** %50 cüzdan + %50 kart
- **Commission split:** Platform fee → TransitIQ hesabı, gerisi tenant'a

---

## 11. Analytics & KPI'lar

### 11.1 İzlenecek Metrikler
**Ürün:**
- DAU / MAU
- Kayıt → ilk bilet conversion rate
- Search → checkout funnel
- Checkout → payment completion
- İptal oranı (genel + 6h rule ihlali)
- Rozet kazanma hızı
- Referral katılımı

**Operasyon:**
- Günlük ciro (tenant bazlı + platform)
- Doluluk oranı (rota bazlı)
- Aktif sefer sayısı
- Şoför aktivasyon oranı (GPS push'u olan / toplam)
- Check-in oranı (yolcu bindi / bilet sayısı)
- No-show oranı

**Teknik:**
- API latency (p50, p95, p99)
- WebSocket connection count
- Error rate (4xx, 5xx)
- Uptime
- Payment failure reasons breakdown

### 11.2 Admin Dashboard Bileşenleri (Planlanan)
1. Ciro grafik (günlük, 30g, 12ay)
2. Aktif sefer haritası (Türkiye üzerinde canlı noktalar)
3. Top 10 rota tablosu
4. Şoför performans listesi
5. İptal/iade özet kartları
6. Müşteri segmentleri pie chart
7. Saat bazlı satış heatmap
8. Real-time "şu an ne oluyor" ticker

---

## 12. Yapılacaklar — Faz Planlaması

### Faz 1 — Temel Ürün (Tamamlandı)
Yolcu arama/ödeme/bilet, admin yönetim, temel güvenlik.

### Faz 2 — Farklılaştırıcı Özellikler (~%90 tamamlandı)
WebSocket koltuklar, canlı sefer takibi, aktarmalı, grup koltuk, AI chatbot, rozet, cüzdan, referral, fiyat alarmı, karbon, audit log, multi-leg.

### Faz 3 — Mobil & Offline (bu sprint'in devamı)
- [ ] PWA manifest + service worker
- [ ] Offline bilet (cached QR)
- [ ] Apple Wallet / Google Wallet pass
- [ ] Push notification subscription
- [ ] Push notification gönderim sistemi (sefer hatırlatma cron)
- [ ] Mobil UX iyileştirmeleri

### Faz 4 — Güvenlik & Güven (aktif)
- [x] Şifre sıfırlama akışı (email token + Resend)
- [x] Email doğrulama kayıtta
- [x] Login brute-force koruması (in-memory tracker, 5 deneme/15dk)
- [x] Google OAuth (passport-google-oauth20, auto user create/link)
- [x] **Güvenlik denetimi** — WebSocket CORS lockdown, PNR PII redaction, Docker JWT_SECRET, MockAuthMiddleware silindi, payment/initialize JWT+server-side price, bcrypt 10→12, password min 8
- [x] Helmet.js + CSP headers (prod'da CSP aktif, dev'de devre dışı)
- [ ] 2FA (TOTP) admin + driver için
- [ ] Session revocation (aktif device listesi + logout all)
- [ ] Refresh token akışı
- [ ] Sentry entegrasyonu (free tier 5k events/ay)
- [ ] KVKK self-servis: veri indirme + hesap silme
- [ ] Çerez consent banner
- [ ] Bot koruması — Cloudflare Turnstile (ücretsiz, reCAPTCHA alternatifi)
- [ ] Untyped `@Body()` parametrelerini DTO'ya dönüştür (auth reset endpoints, ai, passenger-features, booking admin cancel)
- [ ] File upload validation (ileride server-side upload açılırsa)
- [ ] VERBİS kayıt (KVKK Kurumu — ücretsiz, şirket kurulunca)

### Faz 5 — Operasyon Gücü
- [ ] OPERATOR rolü implementation (kısıtlı yetki matrix)
- [x] **OSM Nominatim entegrasyonu** — otogar otomatik çekme (Overpass→Nominatim geçildi)
- [x] Araç maintenance log + fuel log + uyarı cron (günlük 08:00 İstanbul)
- [ ] Tekrarlayan sefer şablonu
- [ ] Dinamik fiyat kuralı motoru (ör: kalkışa 24sa kala %10 indirim)
- [x] Promosyon kodu sistemi (CRUD + apply at checkout + admin panel)
- [x] CSV export (tüm panellerde: araç, sefer, rota, istasyon, şoför, bilet, denetim, promo)
- [x] Şikayet / destek talebi sistemi (kategori, öncelik, durum yönetimi, admin panel)
- [x] Yolcu değerlendirme sistemi (1-5 yıldız, tag'ler, hide moderation, biletlerim'de modal)
- [x] CSV import — araç, istasyon, şoför toplu yükleme (şablon indirme + hata raporu)
- [x] **Kullanıcı şikayet formu** — `/iletisim?tab=complaint` (guest+auth), kategori seçici, PNR ile bilet eşleştirme (server-side), biletlerim'de her bilete "Sorun Bildir" butonu, footer linki
- [x] **İstasyon autocomplete** — custom Combobox, TR-insensitive arama (İ↔i), son seçilenler localStorage, klavye navigasyonu
- [x] **Tarih şeridi** — sonuçlar sayfasında 7 günlük şerit + haftalık ok tuşları + her güne en düşük fiyat (en ucuz gün yeşil vurgulu). Yeni endpoint `/booking/search/price-strip`
- [x] **Dinamik hero badge** — gerçek veri: "X yeni rota · Y yeni şehir" (son 30 gün), veri yoksa fallback mesaj
- [x] **Trip kartlarında şoför puanı** — yıldız + ortalama + yorum sayısı (≥3 yorum olunca). `/booking/search` response'una `driverRating` eklendi
- [x] **Yolcu yorumları panel** — seçili sefer alt kısmında son 5 yorum (PII-maskelenmiş: "M. Y."), ortalama puan rozeti. Endpoint `/booking/trips/:id/reviews`

### Faz 6 — Büyüme & SEO
- [ ] Her rota için SEO-dostu URL (/rotalar/istanbul-ankara)
- [ ] Schema.org JSON-LD
- [ ] sitemap.xml + robots.txt
- [ ] Open Graph meta tags her sayfada
- [ ] Blog yayına hazır hale
- [ ] Loyalty puan sistemi
- [ ] Abonelik modeli (aylık paket)
- [ ] Affiliate programı

### Faz 6.5 — Büyüme & UX Geliştirmeleri (yeni eklendi)
- [ ] **Kurumsal/B2B yolcu hesabı** — şirketler çalışanları için bilet alır (fatura + tek onay)
- [x] **Bekleme listesi** — dolu seferlere kayıt → koltuk boşalınca ilk 5 kişiye otomatik e-posta; guest+auth; yolcu/admin panelleri; cancel flow'una fire-and-forget hook; 24sa re-notify limit
- [ ] **Bilet devretme / hediye** — başkasına PNR transfer
- [ ] **Hediye kartları** — tutar yükleyip başkasına hediye etme
- [ ] **Loyalty seviyeleri** — Silver/Gold/Platinum (rozet sisteminin üstüne)
- [ ] **Grup rezervasyonu indirimleri** — 5+ kişi %10, 10+ kişi %15
- [ ] **Yolcu profili tercihi** — pencere/koridor, ön/arka, favori güzergâh
- [ ] **Saved cards** — Iyzico tokenize edilmiş kart, tek tık ödeme (3DS atlanır)
- [ ] **Split payment** — %50 cüzdan + %50 kart
- [ ] **A/B testing framework** — fiyat/düzen testleri
- [ ] **Feature flags** — deploy'suz özellik aç/kapat
- [ ] **Erişilebilirlik** — tekerlekli sandalye notu, refakatçi indirimi, WCAG AA uyumu
- [ ] **Sesli destek** — AI chatbot'un sesli versiyonu (opsiyonel, ücretsiz Web Speech API)

### Faz 7 — İleri Analitik
- [ ] Admin ciro dashboard (grafikler)
- [ ] Doluluk analizi
- [ ] ML tahminleme (doluluk, ciro)
- [ ] Müşteri segmentasyonu
- [ ] Lifecycle email (hoşgeldin, hatırlatma, re-engagement)
- [ ] A/B test framework

### Faz 7.5 — TÜRKİYE RESMİ ENTEGRASYONLAR ⚠️ (İlk müşteri öncesi ŞART)

**Yasal zorunluluk (yapılmazsa ceza/kapatma):**
- [ ] **U-ETDS entegrasyonu** — T.C. Ulaştırma Bakanlığı, sefer + yolcu anlık raporlama. SOAP API ücretsiz. `servis.uab.gov.tr/uetds/api/`. D1/D2/D4 yetki belgeli firmalar için ŞART.
- [ ] **e-Bilet (GİB)** — Logo/Uyumsoft/Mikro entegratörü üzerinden (~₺1500-2000/ay). 5M+ ciroda zorunlu.
- [ ] **e-Arşiv Fatura** — Aynı entegratörler. 5M+ ciroda zorunlu.

**Çok önerilen:**
- [ ] **NVI KPS TC kimlik doğrulama** — Yolcu kayıtta TC + ad soyad eşleşme. ~₺500 başlangıç + sorgu ücreti.
- [ ] **K-Yetki Belgesi sorgulama** — UAB U-Net üzerinden plaka yetki kontrolü
- [ ] **SRC Belgesi sorgulama** — Şoför yetki kontrolü
- [ ] **VERBİS kayıt** — KVKK Kurumu resmi kayıt (ücretsiz, yapmak ŞART)

**Stratejik avantaj:** U-ETDS'i kendimiz yazarsak (entegratör kullanmadan) bunu **B2B değer önermesi** olarak sunabiliriz — Obilet/Enuygun bunu entegratör üzerinden yapıyor, biz native yaparız.

**Ne zaman:** Şirket kurulduktan ve ilk gerçek otobüs firması müşterisi geldikten hemen sonra.

### Faz 8 — Mobil Uygulamalar (React Native / Expo)
- [ ] Yolcu uygulaması (iOS + Android): arama, ödeme, biletlerim, canlı takip, push
- [ ] Şoför uygulaması (iOS + Android): sefer listesi, QR check-in, GPS push (arka plan), manifesto
- [ ] Admin: mobil-responsive web yeterli (ayrı uygulama gereksiz)
- [ ] Shared NestJS API — aynı backend, yeni client
- [ ] Apple Wallet / Google Wallet bilet pass entegrasyonu
- [ ] App Store + Play Store yayını

### Faz 9 — Platform Growth
- [ ] Super admin paneli
- [ ] Tenant onboarding akışı
- [ ] Komisyon takibi
- [ ] Multi-language (EN/AR/DE)

---

## 13. Test & Kalite

### 13.1 Şu an
- Manuel test ağırlıklı
- Typecheck her build'de

### 13.2 Eklenecek
- [ ] E2E: Playwright (critical path: arama → koltuk → ödeme → bilet)
- [ ] Unit: Jest (service layer)
- [ ] Integration: Supertest (API)
- [ ] Visual regression: Chromatic veya Percy
- [ ] Load test: k6 (payment endpoint, WebSocket)
- [ ] Penetrasyon testi (OWASP ZAP + manuel)

---

## 14. Deployment & Infra

### 14.1 Şu an
- Local dev: Next.js + NestJS ayrı portlarda
- DB: Neon serverless Postgres
- Henüz prod'da değil

### 14.2 Hedef Prod Mimarisi
- **Frontend:** Vercel (Next.js)
- **Backend:** Railway veya Fly.io (NestJS + WebSocket sticky sessions)
- **DB:** Neon Production tier
- **Redis:** Upstash (cache, rate limit, session store)
- **Object Storage:** Cloudflare R2 (PDF biletler, yedek)
- **CDN:** Cloudflare (WAF + DDoS)
- **Monitoring:** Sentry + Uptime Robot
- **DNS:** Cloudflare
- **Email:** Resend (mevcut)
- **SMS:** Netgsm (aktif olunca)
- **Logs:** Better Stack veya Axiom

### 14.3 CI/CD
- [ ] GitHub Actions
  - PR'da: typecheck + test + lint
  - Main merge: auto-deploy staging
  - Manual approve: prod deploy
- [ ] Preview deployments her PR için

---

## 15. İş Modeli

### 15.1 Gelir Kanalları
1. **Komisyon:** Her satılan bilet üzerinden %X (tenant'a yansıtılmaz ya da yansıtılır, test edilecek)
2. **SaaS abonelik:** Tenant'a aylık plan (Başlangıç ₺4.990 / Profesyonel ₺12.990 / Kurumsal özel)
3. **Premium yolcu özellikleri:** Fiyat alarmı sınırsız, öncelikli destek (opsiyonel)
4. **Affiliate:** Hotel/car rental bağlantıları (ileride)

### 15.2 Maliyet
- Iyzico işlem başına komisyon
- Resend email (10k/ay ücretsiz)
- Neon DB (küçük tier ücretsiz, büyüyünce $19/ay)
- Domain + SSL
- Sentry/monitoring (~$0-30/ay)
- SMS (Netgsm aktif olunca, ~0.05₺/SMS)

---

## 16. Öncelik Matrisi (şu an)

| Özellik | Etki | Efor | Öncelik |
|---|---|---|---|
| OSM otogar auto-fetch | Yüksek | Orta | **HEMEN** |
| Araç maintenance/fuel log | Yüksek | Orta | **HEMEN** |
| PWA + offline bilet | Yüksek | Yüksek | Sonraki |
| Push notifications | Yüksek | Orta | Sonraki |
| ~~Şifre sıfırlama~~ | ~~Kritik~~ | ~~Düşük~~ | ✅ |
| ~~Google OAuth~~ | ~~Yüksek~~ | ~~Orta~~ | ✅ |
| 2FA | Yüksek | Orta | Sonraki |
| Sentry | Orta | Düşük | Sonraki |
| Promo kodu | Yüksek | Orta | Faz 5 |
| Sefer şablonu | Orta | Orta | Faz 5 |
| Admin analytics dashboard | Yüksek | Yüksek | Faz 7 |
| OPERATOR rolü | Orta | Düşük | Faz 5 |
| SEO sayfa başına | Yüksek | Orta | Faz 6 |

---

## 17. Karar Kayıtları (ADR — lite)

**KK-001: Leaflet CDN-loaded, npm dep değil.**
Sebep: İlk npm install DNS hatası verdi. CDN yaklaşımı SSR/hydration problemini de çözüyor. İleride internet iyileştiğinde `react-leaflet` alternatif olur.

**KK-002: PNR `TX-XXXXXX` 6 karakter.**
Sebep: Telefon/telsiz üzerinden sözlü iletişim. 32^6 = 1 milyar kombinasyon, ölçekte yeterli.

**KK-003: Multi-leg 10 hub şehriyle sınırlı.**
Sebep: N×M arama maliyeti büyük. Ana hub'lar: İstanbul, Ankara, İzmir, Bursa, Konya, Antalya, Adana, Samsun, Kayseri, Eskişehir.

**KK-004: WebSocket yerel DB state refresh tetikliyor.**
Sebep: CRDT veya Redis pub/sub overkill. Trip başına viewer sayısı düşük (<100). HTTP fetch refresh yeterli.

**KK-005: Audit log JSON blob, ayrı tablo değil.**
Sebep: Entity bazında diff göster, log query'si filtrele. Büyüyünce partitioning (aylık) düşünülecek.

**KK-006: Wikipedia şehir foto fallback'i frontend'den DEĞİL backend'den.**
Sebep: CORS + rate limit. Backend cache + User-Agent header.

**KK-007: `children` prop'lu `Tailwind` notif template hatası preexisting — bu sprint'te düzeltilmeyecek.**

---

## Çalışma Kuralları

1. **Güvenlik asla compromise edilmez.** Her endpoint auth + tenant scope ile çıkar.
2. **Tasarım çizgisi korunur.** Indigo brand, rounded-2xl/3xl, dark mode parity.
3. **AI görünümünden kaçınılır.** Sparkles'ı kısıtla, gradient'leri dengele, gerçek fotoğraflar.
4. **Her değişiklik typecheck'ten geçer.**
5. **Audit log işletiliyor.** Yeni mutasyon eklenirse audit çağrısı zorunlu.
6. **Her yeni özellik bu doküman güncellenir.**
