import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    PlusCircle,
    Trash2,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    Wallet,
    X,
    Lock,
    LogIn,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Tipos ──────────────────────────────────────────────────────
interface Gasto {
    _id: string;
    fecha: string;
    monto: number;
    descripcion: string;
    categoria: string;
    moneda: 'ARS' | 'USD';
}

interface ResumenCategoria {
    _id: string;
    total: number;
    cantidad: number;
}

// ── Constantes ─────────────────────────────────────────────────
const CATEGORIAS = [
    'Comida', 'Transporte', 'Entretenimiento', 'Salud',
    'Ropa', 'Tecnología', 'Educación', 'Servicios', 'Hogar', 'Otros'
];

const COLORES_CATEGORIA: Record<string, string> = {
    Comida:          '#3b82f6',
    Transporte:      '#8b5cf6',
    Entretenimiento: '#ec4899',
    Salud:           '#10b981',
    Ropa:            '#f59e0b',
    Tecnología:      '#06b6d4',
    Educación:       '#6366f1',
    Servicios:       '#f97316',
    Hogar:           '#84cc16',
    Otros:           '#94a3b8',
};

const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function fmt(n: number) {
    return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Gráfico de torta SVG puro ──────────────────────────────────
function GraficoTorta({ resumen, total }: { resumen: ResumenCategoria[], total: number }) {
    const [hover, setHover] = useState<string | null>(null);

    if (resumen.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 w-full text-slate-300 gap-3 min-h-[200px]">
                <TrendingDown size={40} />
                <p className="text-sm font-medium">Sin datos este mes</p>
            </div>
        );
    }

    const cx = 90, cy = 90, r = 75, gap = 0.03;
    let acumulado = 0;
    const slices = resumen.map(item => {
        const fraccion = item.total / total;
        const inicio = acumulado;
        acumulado += fraccion;
        return { ...item, fraccion, inicio };
    });

    const polarToXY = (angulo: number, radio: number) => ({
        x: cx + radio * Math.cos(angulo - Math.PI / 2),
        y: cy + radio * Math.sin(angulo - Math.PI / 2),
    });

    const slicePath = (inicio: number, fin: number, radio: number) => {
        const startA = inicio * 2 * Math.PI + gap;
        const endA = fin * 2 * Math.PI - gap;
        const s = polarToXY(startA, radio);
        const e = polarToXY(endA, radio);
        const large = fin - inicio > 0.5 ? 1 : 0;
        return `M ${cx} ${cy} L ${s.x} ${s.y} A ${radio} ${radio} 0 ${large} 1 ${e.x} ${e.y} Z`;
    };

    return (
        <div className="flex flex-col items-center gap-4 flex-1 w-full">
            <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0">
                {slices.map(slice => {
                    const isHovered = hover === slice._id;
                    const radio = isHovered ? 82 : 75;
                    return (
                        <path
                            key={slice._id}
                            d={slicePath(slice.inicio, slice.inicio + slice.fraccion, radio)}
                            fill={COLORES_CATEGORIA[slice._id] || '#94a3b8'}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => setHover(slice._id)}
                            onMouseLeave={() => setHover(null)}
                            opacity={hover && !isHovered ? 0.5 : 1}
                        />
                    );
                })}
                {/* Centro blanco */}
                <circle cx={cx} cy={cy} r={38} fill="white" />
                <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fontSize={9} fill="#94a3b8" fontWeight="600">TOTAL</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11} fill="#1e293b" fontWeight="800">
                    ${fmt(total)}
                </text>
            </svg>

            {/* Leyenda inteligente: Ocupa el espacio restante exacto */}
            <div className="w-full flex-1 relative min-h-[160px]">
                <div className="absolute inset-0 overflow-y-auto pr-1 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {slices.map(slice => (
                        <div
                            key={slice._id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-default ${hover === slice._id ? 'bg-slate-100' : ''}`}
                            onMouseEnter={() => setHover(slice._id)}
                            onMouseLeave={() => setHover(null)}
                        >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORES_CATEGORIA[slice._id] || '#94a3b8' }} />
                            <span className="text-xs text-slate-600 flex-1 font-medium">{slice._id}</span>
                            <span className="text-xs font-bold text-slate-800">${fmt(slice.total)}</span>
                            <span className="text-xs text-slate-400 w-10 text-right">{(slice.fraccion * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Modal para agregar gasto ───────────────────────────────────
function ModalGasto({
    fecha,
    onGuardar,
    onCerrar,
    cargando,
}: {
    fecha: Date;
    onGuardar: (data: { monto: number; descripcion: string; categoria: string; moneda: 'ARS' | 'USD' }) => void;
    onCerrar: () => void;
    cargando: boolean;
}) {
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState('Comida');
    const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
    const [error, setError] = useState('');

    const handleGuardar = () => {
        if (!monto || !descripcion) { setError('Completá todos los campos'); return; }
        if (Number(monto) <= 0) { setError('El monto debe ser mayor a 0'); return; }
        onGuardar({ monto: Number(monto), descripcion, categoria, moneda });
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-xs font-medium">Agregar gasto</p>
                        <p className="text-white font-bold text-base">
                            {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <button onClick={onCerrar} className="text-white/70 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Monto + moneda */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Monto</label>
                        <div className="flex gap-3">
                            <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
                                {(['ARS', 'USD'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMoneda(m)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${moneda === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                value={monto}
                                onChange={e => setMonto(e.target.value)}
                                placeholder="0"
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 text-lg w-full"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Descripción</label>
                        <input
                            type="text"
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGuardar()}
                            placeholder="Ej: Almuerzo, Nafta, Netflix..."
                            maxLength={100}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Categoría</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {CATEGORIAS.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoria(cat)}
                                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all border ${
                                        categoria === cat
                                            ? 'text-white border-transparent shadow-sm'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                                    }`}
                                    style={categoria === cat ? { background: COLORES_CATEGORIA[cat], borderColor: COLORES_CATEGORIA[cat] } : {}}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl font-medium">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCerrar}
                            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardar}
                            disabled={cargando}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-blue-200"
                        >
                            {cargando ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Pantalla principal del gestor ──────────────────────────────
interface GestorScreenProps {
    onIrALogin: () => void;
}

export default function GestorScreen({ onIrALogin }: GestorScreenProps) {
    const { estaAutenticado, token } = useAuth();

    const hoy = new Date();
    const [mes, setMes] = useState(hoy.getMonth());
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [gastos, setGastos] = useState<Gasto[]>([]);
    
    const [resumen, setResumen] = useState<ResumenCategoria[]>([]);
    const [totalMes, setTotalMes] = useState(0);
    
    const [cargando, setCargando] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
    const [guardando, setGuardando] = useState(false);
    
    const [cotizacionUsd, setCotizacionUsd] = useState(1410); 

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const obtenerDolarOficial = async () => {
            try {
                const respuesta = await axios.get('https://dolarapi.com/v1/dolares');
                const dolarOficial = respuesta.data.find((d: any) => d.casa === 'oficial' || d.nombre === 'Oficial');
                
                if (dolarOficial && dolarOficial.venta) {
                    setCotizacionUsd(dolarOficial.venta);
                }
            } catch (error) {
                console.error('Error al obtener el dólar oficial:', error);
            }
        };
        obtenerDolarOficial();
    }, []);

    const cargarDatos = useCallback(async () => {
        if (!estaAutenticado) return;
        setCargando(true);
        try {
            const gastosRes = await axios.get(`${API_URL}/api/gastos?mes=${mes + 1}&anio=${anio}`, { headers });
            setGastos(gastosRes.data);
        } catch (err) {
            console.error('Error cargando gastos:', err);
        } finally {
            setCargando(false);
        }
    }, [mes, anio, estaAutenticado, token]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    useEffect(() => {
        let nuevoTotal = 0;
        const categoriasMap: Record<string, { total: number, cantidad: number }> = {};

        gastos.forEach(g => {
            const valorNormalizado = g.moneda === 'USD' ? g.monto * cotizacionUsd : g.monto;
            
            nuevoTotal += valorNormalizado;
            
            if (!categoriasMap[g.categoria]) {
                categoriasMap[g.categoria] = { total: 0, cantidad: 0 };
            }
            categoriasMap[g.categoria].total += valorNormalizado;
            categoriasMap[g.categoria].cantidad += 1;
        });

        const nuevoResumen = Object.keys(categoriasMap).map(cat => ({
            _id: cat,
            total: categoriasMap[cat].total,
            cantidad: categoriasMap[cat].cantidad
        })).sort((a, b) => b.total - a.total);

        setTotalMes(nuevoTotal);
        setResumen(nuevoResumen);
    }, [gastos, cotizacionUsd]);

    const handleGuardar = async (data: { monto: number; descripcion: string; categoria: string; moneda: 'ARS' | 'USD' }) => {
        if (!diaSeleccionado) return;
        setGuardando(true);
        try {
            await axios.post(`${API_URL}/api/gastos`, {
                ...data,
                fecha: diaSeleccionado.toISOString(),
            }, { headers });
            setDiaSeleccionado(null);
            await cargarDatos();
        } catch (err) {
            console.error('Error guardando gasto:', err);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este gasto?')) return;
        try {
            await axios.delete(`${API_URL}/api/gastos/${id}`, { headers });
            await cargarDatos();
        } catch (err) {
            console.error('Error eliminando gasto:', err);
        }
    };

    const cambiarMes = (delta: number) => {
        let nuevoMes = mes + delta;
        let nuevoAnio = anio;
        if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
        if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
        setMes(nuevoMes);
        setAnio(nuevoAnio);
    };

    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    const gastosPorDia: Record<number, number> = {};
    gastos.forEach(g => {
        const d = new Date(g.fecha).getDate();
        const valorNormalizado = g.moneda === 'USD' ? g.monto * cotizacionUsd : g.monto;
        gastosPorDia[d] = (gastosPorDia[d] || 0) + valorNormalizado;
    });

    const gastosDiaSeleccionado = diaSeleccionado
        ? gastos.filter(g => {
            const fg = new Date(g.fecha);
            return fg.getDate() === diaSeleccionado.getDate() &&
                   fg.getMonth() === diaSeleccionado.getMonth() &&
                   fg.getFullYear() === diaSeleccionado.getFullYear();
        })
        : [];

    if (!estaAutenticado) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center px-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Lock className="text-blue-500" size={28} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Gestor de Finanzas</h2>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs">
                        Iniciá sesión para llevar el registro de tus gastos día a día y ver tus estadísticas.
                    </p>
                </div>
                <button
                    onClick={onIrALogin}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm shadow-blue-200"
                >
                    <LogIn size={18} />
                    Iniciar sesión
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

            {/* Header del gestor */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        Mis Finanzas
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Registrá tus gastos y analizá en qué gastás más</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-right shadow-sm">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total {MESES[mes]}</p>
                    <p className="text-2xl font-extrabold text-slate-800">${fmt(totalMes)}</p>
                    <p className="text-xs text-slate-400">ARS</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

                {/* ── Columna izquierda: Calendario ── */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Nav de mes */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <button onClick={() => cambiarMes(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="font-bold text-slate-800">{MESES[mes]} {anio}</h2>
                        <button onClick={() => cambiarMes(1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="p-4">
                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 mb-2">
                            {DIAS_SEMANA.map(d => (
                                <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
                            ))}
                        </div>

                        {/* Grilla de días */}
                        {cargando ? (
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 35 }).map((_, i) => (
                                    <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-1">
                                {/* Celdas vacías antes del primer día */}
                                {Array.from({ length: primerDia }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}

                                {/* Días del mes */}
                                {Array.from({ length: diasEnMes }, (_, i) => i + 1).map(dia => {
                                    const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
                                    const tieneGastos = !!gastosPorDia[dia];
                                    const esteGasto = gastosPorDia[dia] || 0;
                                    const fechaDia = new Date(anio, mes, dia);
                                    const seleccionado = diaSeleccionado?.getDate() === dia &&
                                        diaSeleccionado?.getMonth() === mes &&
                                        diaSeleccionado?.getFullYear() === anio;

                                    return (
                                        <button
                                            key={dia}
                                            onClick={() => setDiaSeleccionado(seleccionado ? null : fechaDia)}
                                            className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all min-h-[52px] border ${
                                                seleccionado
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                                    : esHoy
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : tieneGastos
                                                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                                                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className={`text-xs font-bold leading-none ${seleccionado ? 'text-white' : ''}`}>{dia}</span>
                                            {tieneGastos && (
                                                <span className={`text-[9px] font-bold mt-0.5 leading-none ${seleccionado ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    ${esteGasto >= 1000 ? `${(esteGasto / 1000).toFixed(1)}k` : fmt(esteGasto)}
                                                </span>
                                            )}
                                            {tieneGastos && (
                                                <span className={`w-1 h-1 rounded-full mt-0.5 ${seleccionado ? 'bg-blue-300' : 'bg-blue-400'}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Panel de gastos del día seleccionado */}
                    {diaSeleccionado && (
                        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-slate-700 text-sm">
                                    {diaSeleccionado.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                                <button
                                    onClick={() => setDiaSeleccionado(new Date(diaSeleccionado))}
                                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <PlusCircle size={14} />
                                    Agregar
                                </button>
                            </div>

                            {gastosDiaSeleccionado.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-slate-400 text-sm">Sin gastos registrados</p>
                                    <button
                                        onClick={() => {
                                            const d = diaSeleccionado;
                                            setDiaSeleccionado(null);
                                            setTimeout(() => setDiaSeleccionado(d), 10);
                                        }}
                                        className="mt-2 text-blue-600 text-xs font-semibold hover:underline"
                                    >
                                        ¿Querés agregar uno?
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {gastosDiaSeleccionado.map(g => (
                                        <div key={g._id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-slate-100 shadow-xs">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ background: COLORES_CATEGORIA[g.categoria] || '#94a3b8' }}
                                            />
                                            <span className="flex-1 text-sm text-slate-700 font-medium truncate">{g.descripcion}</span>
                                            <span className="text-xs text-slate-400 font-medium">{g.categoria}</span>
                                            <span className="font-bold text-slate-800 text-sm">{g.moneda === 'USD' ? 'U$D' : '$'}{fmt(g.monto)}</span>
                                            <button
                                                onClick={() => handleEliminar(g._id)}
                                                className="text-slate-300 hover:text-red-400 transition-colors shrink-0 p-1"
                                                title="Eliminar gasto"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Botón grande de agregar cuando hay un día seleccionado */}
                            <button
                                onClick={() => {
                                    const d = diaSeleccionado;
                                    setDiaSeleccionado(null);
                                    setTimeout(() => setDiaSeleccionado(d), 10);
                                }}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 text-blue-500 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-sm font-semibold transition-all"
                            >
                                <PlusCircle size={18} />
                                Agregar gasto a este día
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Columna derecha: Gráfico ── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 shrink-0">Distribución {MESES[mes]}</h3>
                    <GraficoTorta resumen={resumen} total={totalMes} />
                </div>
            </div>

            {/* ── Sección extra: Gastos totales del mes ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">
                <h3 className="font-extrabold text-slate-800 text-lg mb-6 border-b border-slate-100 pb-3">
                    Todos los gastos del mes
                </h3>
                
                {gastos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p>No hay gastos registrados este mes.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {gastos
                            .slice()
                            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                            .map(g => (
                                <div key={g._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center min-w-[65px]">
                                            <p className="text-xs text-slate-400 font-bold uppercase">{DIAS_SEMANA[new Date(g.fecha).getDay()]}</p>
                                            <p className="text-sm font-extrabold text-slate-700">{new Date(g.fecha).getDate()}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-base">{g.descripcion}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORES_CATEGORIA[g.categoria] || '#94a3b8' }} />
                                                <p className="text-xs font-medium text-slate-500">{g.categoria}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0">
                                        <span className="font-extrabold text-slate-800 text-lg">
                                            {g.moneda === 'USD' ? 'U$D ' : '$ '}{fmt(g.monto)}
                                        </span>
                                        <button
                                            onClick={() => handleEliminar(g._id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Eliminar gasto"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Modal para agregar gasto */}
            {diaSeleccionado && (
                <ModalGasto
                    fecha={diaSeleccionado}
                    onGuardar={handleGuardar}
                    onCerrar={() => setDiaSeleccionado(null)}
                    cargando={guardando}
                />
            )}
        </div>
    );
}