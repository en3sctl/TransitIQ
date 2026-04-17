"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Activity, User as UserIcon, Building2, Calendar, Filter } from "lucide-react";
import api from "@/lib/api";

interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any;
  newValues: any;
  timestamp: string;
  user: { id: string; name: string; email: string; role: string } | null;
  tenant: { id: string; name: string; publicName: string | null; slug: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'emerald', UPDATE: 'sky', DELETE: 'rose',
  BOOKING_CANCEL: 'amber', BOOKING_REFUND: 'indigo',
  TENANT_APPROVE: 'emerald', TENANT_REJECT: 'rose', TENANT_SUSPEND: 'rose',
  IMPERSONATE_START: 'purple', IMPERSONATE_END: 'purple',
  USER_SUSPEND: 'rose', USER_UNSUSPEND: 'emerald', USER_PASSWORD_RESET: 'amber',
  ANNOUNCEMENT_CREATE: 'indigo',
};
const TONE: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  sky: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
  slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
};

export function PlatformAuditPanel() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/audit-log', {
        params: { action: action || undefined, take: 200 },
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [action]);

  const filtered = query
    ? items.filter((i) =>
        (i.user?.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (i.user?.email || '').toLowerCase().includes(query.toLowerCase()) ||
        (i.tenant?.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (i.entityId || '').toLowerCase().includes(query.toLowerCase()) ||
        i.action.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kullanıcı, firma, entity ID veya action ara..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold"
        >
          <option value="">Tüm aksiyonlar</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="BOOKING_CANCEL">BOOKING_CANCEL</option>
          <option value="TENANT_APPROVE">TENANT_APPROVE</option>
          <option value="TENANT_REJECT">TENANT_REJECT</option>
          <option value="IMPERSONATE_START">IMPERSONATE</option>
          <option value="USER_SUSPEND">USER_SUSPEND</option>
          <option value="USER_PASSWORD_RESET">PASSWORD_RESET</option>
        </select>
        <span className="text-[11px] font-bold text-slate-500 ml-auto">{filtered.length} / {total} kayıt</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <Activity className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Kayıt yok</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {filtered.map((item) => {
              const color = ACTION_COLORS[item.action] || 'slate';
              return (
                <div key={item.id} className="p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-0.5 shrink-0 w-24">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${TONE[color]}`}>
                        {item.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.entityType}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-3 flex-wrap">
                        {item.user && (
                          <span className="inline-flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-slate-900 dark:text-white">{item.user.name}</span>
                            <span className="text-[10px] text-slate-400">({item.user.role})</span>
                          </span>
                        )}
                        {item.tenant && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {item.tenant.publicName || item.tenant.name}
                          </span>
                        )}
                      </p>
                      {(item.oldValues || item.newValues) && (
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-1 truncate">
                          {item.entityId && <span className="text-slate-400">{item.entityId.slice(0, 12)}...</span>}
                          {item.newValues && ' → ' + JSON.stringify(item.newValues).slice(0, 120)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
