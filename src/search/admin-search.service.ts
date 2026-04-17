import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface SearchResult {
  type: string;        // booking | vehicle | driver | route | station | trip | promo | complaint | user | tenant | waiting-list
  id: string;
  title: string;
  subtitle: string;
  tab: string;         // admin tab to navigate to
  meta?: Record<string, any>;
}

export interface SearchGroup {
  type: string;
  label: string;
  items: SearchResult[];
  total: number;
}

@Injectable()
export class AdminSearchService {
  private readonly PER_CATEGORY = 6;

  constructor(private prisma: PrismaService) {}

  async search(tenantId: string, role: string, rawQuery: string): Promise<SearchGroup[]> {
    const q = rawQuery.trim();
    if (q.length < 2) return [];

    const isSuperAdmin = role === 'SUPER_ADMIN';
    // Non-superadmins are constrained to their tenant
    const tenantFilter = (extra: any = {}) => isSuperAdmin ? extra : { ...extra, tenantId };

    const [
      bookings, vehicles, drivers, routes, stations, trips, promos, complaints, users, waitingList,
      tenants,
    ] = await Promise.all([
      this.searchBookings(q, tenantFilter),
      this.searchVehicles(q, tenantFilter),
      this.searchDrivers(q, tenantFilter),
      this.searchRoutes(q, tenantFilter),
      this.searchStations(q, tenantFilter),
      this.searchTrips(q, tenantFilter),
      this.searchPromos(q, tenantFilter),
      this.searchComplaints(q, tenantFilter),
      this.searchUsers(q, tenantFilter),
      this.searchWaitingList(q, tenantFilter),
      isSuperAdmin ? this.searchTenants(q) : Promise.resolve({ items: [], total: 0 }),
    ]);

    const groups: SearchGroup[] = [
      { type: 'booking', label: 'Biletler', ...bookings },
      { type: 'trip', label: 'Seferler', ...trips },
      { type: 'route', label: 'Rotalar', ...routes },
      { type: 'vehicle', label: 'Araçlar', ...vehicles },
      { type: 'driver', label: 'Sürücüler', ...drivers },
      { type: 'station', label: 'İstasyonlar', ...stations },
      { type: 'promo', label: 'Promo Kodları', ...promos },
      { type: 'complaint', label: 'Şikayetler', ...complaints },
      { type: 'waiting-list', label: 'Bekleme Listesi', ...waitingList },
      { type: 'user', label: 'Kullanıcılar', ...users },
      { type: 'tenant', label: 'Firmalar', ...tenants },
    ];

    return groups.filter((g) => g.items.length > 0);
  }

  // ─── Individual searchers ───

  private async searchBookings(q: string, tf: (extra?: any) => any) {
    const qUpper = q.toUpperCase();
    const where = tf({
      OR: [
        { pnrCode: { contains: qUpper, mode: 'insensitive' as const } },
        { passengerName: { contains: q, mode: 'insensitive' as const } },
        { contactEmail: { contains: q, mode: 'insensitive' as const } },
        { contactPhone: { contains: q } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        take: this.PER_CATEGORY,
        orderBy: { bookingTime: 'desc' },
        select: {
          id: true, pnrCode: true, passengerName: true, status: true, pricePaid: true,
          trip: {
            select: {
              route: {
                select: {
                  originStation: { select: { city: true } },
                  destinationStation: { select: { city: true } },
                },
              },
              departureTime: true,
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((b) => ({
        type: 'booking',
        id: b.id,
        title: `${b.pnrCode} · ${b.passengerName}`,
        subtitle: `${b.trip.route.originStation.city} → ${b.trip.route.destinationStation.city} · ${new Date(b.trip.departureTime).toLocaleDateString('tr-TR')} · ${b.status}`,
        tab: 'bookings',
        meta: { bookingId: b.id, pnr: b.pnrCode },
      })),
      total,
    };
  }

  private async searchVehicles(q: string, tf: (extra?: any) => any) {
    const where = tf({
      deletedAt: null,
      OR: [
        { registrationPlate: { contains: q, mode: 'insensitive' as const } },
        { make: { contains: q, mode: 'insensitive' as const } },
        { model: { contains: q, mode: 'insensitive' as const } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where, take: this.PER_CATEGORY,
        select: { id: true, registrationPlate: true, make: true, model: true, layoutType: true, capacity: true },
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((v) => ({
        type: 'vehicle',
        id: v.id,
        title: `${v.registrationPlate} · ${v.make} ${v.model}`,
        subtitle: `${v.layoutType} · ${v.capacity} koltuk`,
        tab: 'vehicles',
        meta: { vehicleId: v.id },
      })),
      total,
    };
  }

  private async searchDrivers(q: string, tf: (extra?: any) => any) {
    const where = tf({
      role: { in: ['DRIVER'] as const },
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
        { phoneNumber: { contains: q } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where, take: this.PER_CATEGORY,
        select: { id: true, name: true, email: true, phoneNumber: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((d) => ({
        type: 'driver',
        id: d.id,
        title: d.name,
        subtitle: `${d.email}${d.phoneNumber ? ' · ' + d.phoneNumber : ''}`,
        tab: 'drivers',
        meta: { driverId: d.id },
      })),
      total,
    };
  }

  private async searchRoutes(q: string, tf: (extra?: any) => any) {
    const where = tf({
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { originStation: { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { city: { contains: q, mode: 'insensitive' as const } }] } },
        { destinationStation: { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { city: { contains: q, mode: 'insensitive' as const } }] } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.route.findMany({
        where, take: this.PER_CATEGORY,
        select: {
          id: true, title: true, basePrice: true, totalDistanceKm: true,
          originStation: { select: { city: true, name: true } },
          destinationStation: { select: { city: true, name: true } },
        },
      }),
      this.prisma.route.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((r) => ({
        type: 'route',
        id: r.id,
        title: `${r.originStation.city} → ${r.destinationStation.city}`,
        subtitle: `${r.totalDistanceKm} km · ₺${Number(r.basePrice)}`,
        tab: 'routes',
        meta: { routeId: r.id },
      })),
      total,
    };
  }

  private async searchStations(q: string, tf: (extra?: any) => any) {
    const where = tf({
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { city: { contains: q, mode: 'insensitive' as const } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.station.findMany({
        where, take: this.PER_CATEGORY,
        select: { id: true, name: true, city: true },
      }),
      this.prisma.station.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((s) => ({
        type: 'station',
        id: s.id,
        title: s.name,
        subtitle: s.city,
        tab: 'stations',
        meta: { stationId: s.id },
      })),
      total,
    };
  }

  private async searchTrips(q: string, tf: (extra?: any) => any) {
    // Trip doesn't have a searchable text field — use route/driver/plate matches
    const where = tf({
      status: { in: ['PLANNED', 'ACTIVE'] as const },
      OR: [
        { id: { startsWith: q } },
        { route: { OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { originStation: { city: { contains: q, mode: 'insensitive' as const } } },
          { destinationStation: { city: { contains: q, mode: 'insensitive' as const } } },
        ] } },
        { driver: { name: { contains: q, mode: 'insensitive' as const } } },
        { vehicle: { registrationPlate: { contains: q, mode: 'insensitive' as const } } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where, take: this.PER_CATEGORY,
        orderBy: { departureTime: 'asc' },
        select: {
          id: true, departureTime: true, status: true,
          route: { select: { originStation: { select: { city: true } }, destinationStation: { select: { city: true } } } },
          vehicle: { select: { registrationPlate: true } },
          driver: { select: { name: true } },
        },
      }),
      this.prisma.trip.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((t) => ({
        type: 'trip',
        id: t.id,
        title: `${t.route.originStation.city} → ${t.route.destinationStation.city}`,
        subtitle: `${new Date(t.departureTime).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${t.vehicle.registrationPlate} · ${t.driver.name}`,
        tab: 'trips',
        meta: { tripId: t.id },
      })),
      total,
    };
  }

  private async searchPromos(q: string, tf: (extra?: any) => any) {
    const where = tf({
      code: { contains: q.toUpperCase(), mode: 'insensitive' as const },
    });
    const [items, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        where, take: this.PER_CATEGORY,
        select: { id: true, code: true, discountType: true, discountValue: true, active: true, usedCount: true, maxUses: true },
      }),
      this.prisma.promoCode.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((p) => ({
        type: 'promo',
        id: p.id,
        title: p.code,
        subtitle: `${p.discountType === 'PERCENT' ? '%' : '₺'}${Number(p.discountValue)} · ${p.usedCount}${p.maxUses ? '/' + p.maxUses : ''} kullanım · ${p.active ? 'Aktif' : 'Pasif'}`,
        tab: 'promo',
        meta: { promoId: p.id },
      })),
      total,
    };
  }

  private async searchComplaints(q: string, tf: (extra?: any) => any) {
    const where = tf({
      OR: [
        { subject: { contains: q, mode: 'insensitive' as const } },
        { contactName: { contains: q, mode: 'insensitive' as const } },
        { contactEmail: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where, take: this.PER_CATEGORY,
        orderBy: { createdAt: 'desc' },
        select: { id: true, subject: true, contactName: true, category: true, status: true, priority: true },
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((c) => ({
        type: 'complaint',
        id: c.id,
        title: c.subject,
        subtitle: `${c.contactName} · ${c.category} · ${c.status}${c.priority === 'HIGH' || c.priority === 'URGENT' ? ' · ⚠ ' + c.priority : ''}`,
        tab: 'feedback',
        meta: { complaintId: c.id },
      })),
      total,
    };
  }

  private async searchUsers(q: string, tf: (extra?: any) => any) {
    const where = tf({
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ],
      // Exclude drivers (surfaced in their own group)
      NOT: { role: 'DRIVER' },
    });
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where, take: this.PER_CATEGORY,
        select: { id: true, name: true, email: true, role: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((u) => ({
        type: 'user',
        id: u.id,
        title: u.name,
        subtitle: `${u.email} · ${u.role}`,
        tab: 'drivers', // no dedicated users tab yet — fallback
        meta: { userId: u.id },
      })),
      total,
    };
  }

  private async searchWaitingList(q: string, tf: (extra?: any) => any) {
    const where = tf({
      OR: [
        { contactName: { contains: q, mode: 'insensitive' as const } },
        { contactEmail: { contains: q, mode: 'insensitive' as const } },
        { contactPhone: { contains: q } },
      ],
    });
    const [items, total] = await Promise.all([
      this.prisma.waitingListEntry.findMany({
        where, take: this.PER_CATEGORY,
        orderBy: { createdAt: 'desc' },
        select: { id: true, contactName: true, contactEmail: true, status: true, passengerCount: true },
      }),
      this.prisma.waitingListEntry.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((e) => ({
        type: 'waiting-list',
        id: e.id,
        title: e.contactName,
        subtitle: `${e.contactEmail} · ${e.passengerCount} kişi · ${e.status}`,
        tab: 'waiting-list',
        meta: { entryId: e.id },
      })),
      total,
    };
  }

  private async searchTenants(q: string) {
    const where = {
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { publicName: { contains: q, mode: 'insensitive' as const } },
        { slug: { contains: q, mode: 'insensitive' as const } },
        { domain: { contains: q, mode: 'insensitive' as const } },
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where, take: this.PER_CATEGORY,
        select: { id: true, name: true, publicName: true, slug: true, status: true },
      }),
      this.prisma.tenant.count({ where }),
    ]);
    return {
      items: items.map<SearchResult>((t) => ({
        type: 'tenant',
        id: t.id,
        title: t.publicName || t.name,
        subtitle: `/firma/${t.slug} · ${t.status}`,
        tab: 'super-tenants',
        meta: { tenantId: t.id },
      })),
      total,
    };
  }
}
