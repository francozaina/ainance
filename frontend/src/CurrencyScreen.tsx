import { useState, useEffect, useCallback, useRef } from 'react'; // useRef used in CurrencySelect
import {
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Clock,
  AlertCircle,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface RateMap {
  [code: string]: number;
}

interface CurrencyMeta {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', name: 'Dólar estadounidense', flag: '🇺🇸', symbol: '$' },
  { code: 'ARS', name: 'Peso argentino',        flag: '🇦🇷', symbol: '$' },
  { code: 'EUR', name: 'Euro',                  flag: '🇪🇺', symbol: '€' },
  { code: 'BRL', name: 'Real brasileño',         flag: '🇧🇷', symbol: 'R$' },
  { code: 'CLP', name: 'Peso chileno',           flag: '🇨🇱', symbol: '$' },
  { code: 'COP', name: 'Peso colombiano',        flag: '🇨🇴', symbol: '$' },
  { code: 'MXN', name: 'Peso mexicano',          flag: '🇲🇽', symbol: '$' },
  { code: 'GBP', name: 'Libra esterlina',        flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Yen japonés',            flag: '🇯🇵', symbol: '¥' },
  { code: 'UYU', name: 'Peso uruguayo',          flag: '🇺🇾', symbol: '$' },
  { code: 'PYG', name: 'Guaraní paraguayo',      flag: '🇵🇾', symbol: '₲' },
  { code: 'BOB', name: 'Boliviano',              flag: '🇧🇴', symbol: 'Bs' },
];

const META: Record<string, CurrencyMeta> = Object.fromEntries(
  CURRENCIES.map(c => [c.code, c])
);

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function fmt(value: number, decimals = 2): string {
  if (!isFinite(value)) return '—';
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtSmart(value: number): string {
  if (!isFinite(value)) return '—';
  if (value >= 1000) return fmt(value, 2);
  if (value >= 1)    return fmt(value, 4);
  return fmt(value, 6);
}

// ────────────────────────────────────────────────────────────
// Custom select — dropdown is position:absolute inside a
// position:relative wrapper, so it always anchors to the
// button regardless of scroll position.
// The card parent must NOT have overflow:hidden (it doesn't).
// ────────────────────────────────────────────────────────────
function CurrencySelect({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const current = META[value];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    // position:relative here is the anchor for the absolute dropdown
    <div ref={wrapperRef} className="relative min-w-[200px]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-blue-400 transition-all w-full"
      >
        <span className="text-xl leading-none">{current.flag}</span>
        <span className="font-bold">{current.code}</span>
        <span className="text-slate-400 font-normal truncate flex-1 text-left">{current.name}</span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          // top:100% = flush below the button; z-[9999] floats above everything
          className="absolute top-full left-0 mt-1 min-w-full w-60 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-[9999]"
        >
          {CURRENCIES.filter(c => c.code !== exclude).map(c => (
            <button
              key={c.code}
              onClick={() => { onChange(c.code); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors text-left ${value === c.code ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'}`}
            >
              <span className="text-lg leading-none shrink-0">{c.flag}</span>
              <span className="font-semibold">{c.code}</span>
              <span className="text-slate-400 truncate">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

// Multiple free APIs tried in order — if one fails, the next is used
async function fetchRatesWithFallback(): Promise<RateMap> {
  const errors: string[] = [];

  // ── 1st: open.er-api.com — free, no key, CORS-friendly ──
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        // keep only the currencies we care about + USD
        const codes = CURRENCIES.map(c => c.code);
        const filtered: RateMap = { USD: 1 };
        for (const code of codes) {
          if (data.rates[code]) filtered[code] = data.rates[code];
        }
        return filtered;
      }
    }
    errors.push('open.er-api failed');
  } catch (e) {
    errors.push(`open.er-api: ${e}`);
  }

  // ── 2nd: frankfurter.app ──
  try {
    const symbols = CURRENCIES.filter(c => c.code !== 'USD').map(c => c.code).join(',');
    const res = await fetch(
      `https://api.frankfurter.app/latest?base=USD&symbols=${symbols}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.rates) return { USD: 1, ...data.rates };
    }
    errors.push('frankfurter failed');
  } catch (e) {
    errors.push(`frankfurter: ${e}`);
  }

  // ── 3rd: exchangerate.host ──
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        const codes = CURRENCIES.map(c => c.code);
        const filtered: RateMap = { USD: 1 };
        for (const code of codes) {
          if (data.rates[code]) filtered[code] = data.rates[code];
        }
        return filtered;
      }
    }
    errors.push('exchangerate.host failed');
  } catch (e) {
    errors.push(`exchangerate.host: ${e}`);
  }

  throw new Error(`All APIs failed: ${errors.join(' | ')}`);
}

export default function CurrencyScreen() {
  const [rates, setRates] = useState<RateMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [from, setFrom] = useState('USD');
  const [to,   setTo]   = useState('ARS');
  const [amount, setAmount] = useState<string>('1');

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetchRatesWithFallback();
      setRates(r);
      setLastUpdate(new Date());
    } catch {
      setError('No se pudieron cargar las cotizaciones. Verificá tu conexión o intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const numAmount = parseFloat(amount) || 0;

  const convertedValue = (() => {
    if (!rates[from] || !rates[to]) return null;
    const inUSD = numAmount / rates[from];
    return inUSD * rates[to];
  })();

  const reverseRate = (() => {
    if (!rates[from] || !rates[to]) return null;
    return rates[to] / rates[from];
  })();

  const reverseRateInv = reverseRate ? 1 / reverseRate : null;

  const swap = () => { setFrom(to); setTo(from); };

  const quickAmounts = [1, 10, 100, 1000];

  const tableRows = CURRENCIES
    .filter(c => c.code !== from && rates[c.code] && rates[from])
    .map(c => ({ ...c, rate: rates[c.code] / rates[from] }));

  const fromMeta = META[from];
  const toMeta   = META[to];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* ── main converter card ── */}
        {/* NOTE: no overflow-hidden here so dropdowns can escape */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          {/* header strip */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-blue-100" />
              <span className="text-white font-bold tracking-tight">Convertidor de monedas</span>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-blue-200 text-xs flex items-center gap-1">
                  <Clock size={12} />
                  {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={fetchRates}
                disabled={loading}
                className="text-white/80 hover:text-white transition-colors"
                title="Actualizar cotizaciones"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
                <button onClick={fetchRates} className="ml-auto text-red-500 hover:text-red-700 underline text-xs font-semibold">
                  Reintentar
                </button>
              </div>
            )}

            {/* FROM row */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Convertir</label>
              <div className="flex gap-3 items-center flex-wrap">
                <input
                  type="number"
                  value={amount}
                  min="0"
                  onChange={e => setAmount(e.target.value)}
                  className="w-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="1"
                />
                <CurrencySelect value={from} onChange={setFrom} exclude={to} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map(q => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${parseFloat(amount) === q ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'}`}
                  >
                    {fromMeta.symbol}{q.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap button */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <button
                onClick={swap}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 transition-all"
              >
                <ArrowLeftRight size={13} /> Invertir
              </button>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* TO row */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equivale a</label>
              <div className="flex gap-3 items-center flex-wrap">
                <div className="w-40 px-4 py-3 bg-slate-900 rounded-xl">
                  {loading ? (
                    <div className="h-7 w-24 bg-slate-700 rounded animate-pulse" />
                  ) : (
                    <span className="text-white font-bold text-lg block truncate">
                      {convertedValue !== null ? fmtSmart(convertedValue) : '—'}
                    </span>
                  )}
                </div>
                <CurrencySelect value={to} onChange={setTo} exclude={from} />
              </div>
            </div>

            {/* rate info */}
            {!loading && reverseRate !== null && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-1">
                <p className="text-blue-700 text-sm font-semibold">
                  1 {fromMeta.code} = {fmtSmart(reverseRate)} {toMeta.code}
                </p>
                <p className="text-blue-500 text-xs">
                  1 {toMeta.code} = {fmtSmart(reverseRateInv!)} {fromMeta.code}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── rates table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Todas las monedas vs <span className="text-blue-600">{fromMeta.flag} {from}</span>
            </h3>
            {loading && <RefreshCw size={14} className="animate-spin text-slate-400" />}
          </div>

          {loading && tableRows.length === 0 ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center px-6 py-3.5 gap-3">
                  <div className="w-8 h-6 bg-slate-100 rounded animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
                    <div className="h-2 w-28 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {tableRows.map(row => {
                const isHighValue = row.rate > 1;
                return (
                  <button
                    key={row.code}
                    onClick={() => setTo(row.code)}
                    className={`w-full flex items-center px-6 py-3.5 hover:bg-slate-50 transition-colors text-left ${to === row.code ? 'bg-blue-50/60' : ''}`}
                  >
                    <span className="text-xl w-8 shrink-0">{row.flag}</span>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{row.code}</p>
                      <p className="text-xs text-slate-400 truncate">{row.name}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-slate-800 text-sm tabular-nums">{fmtSmart(row.rate)}</p>
                      <div className={`flex items-center justify-end gap-0.5 text-xs ${isHighValue ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {isHighValue ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span>diario</span>
                      </div>
                    </div>
                    {to === row.code && (
                      <span className="ml-3 text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full shrink-0">Activa</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {lastUpdate && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={11} />
              Actualizado: {lastUpdate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}, {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              <span className="ml-1 text-slate-300">· Fuente: open.er-api.com / BCE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
