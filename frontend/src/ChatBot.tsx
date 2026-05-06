import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Markdown from 'react-markdown';
import { Sparkles, X, Send, Trash2, Bot } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Mensaje {
    id: number;
    rol: 'user' | 'bot';
    texto: string;
    cargando?: boolean;
}

const SUGERENCIAS = [
    '¿Qué plataforma me conviene para cobrar $500?',
    '¿Cuánto me queda si cobro $1000 por Payoneer?',
    '¿Cómo está el dólar blue hoy?',
];

export default function ChatBot() {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([
        {
            id: 0,
            rol: 'bot',
            texto: '¡Hola! Soy el experto de **Ai.nance** 👋\n\nPodés preguntarme sobre plataformas de cobro, comisiones, el dólar blue o cómo optimizar tus cobros como freelancer argentino.',
        }
    ]);
    const [input, setInput] = useState('');
    const [cargando, setCargando] = useState(false);
    const [puntito, setPuntito] = useState(false); // notif cuando está cerrado
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const nextId = useRef(1);

    // Scroll al último mensaje
    useEffect(() => {
        if (abierto) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes, abierto]);

    // Focus al abrir
    useEffect(() => {
        if (abierto) setTimeout(() => inputRef.current?.focus(), 150);
    }, [abierto]);

    const enviar = async (texto: string) => {
        const pregunta = texto.trim();
        if (!pregunta || cargando) return;
        setInput('');

        const idUser = nextId.current++;
        const idBot = nextId.current++;

        setMensajes(prev => [
            ...prev,
            { id: idUser, rol: 'user', texto: pregunta },
            { id: idBot, rol: 'bot', texto: '', cargando: true },
        ]);
        setCargando(true);

        try {
            const res = await axios.post(`${API_URL}/api/chat`, { mensaje: pregunta });
            setMensajes(prev => prev.map(m =>
                m.id === idBot ? { ...m, texto: res.data.respuesta, cargando: false } : m
            ));
            // Si el chat está cerrado, mostrar puntito de notificación
            if (!abierto) setPuntito(true);
        } catch {
            setMensajes(prev => prev.map(m =>
                m.id === idBot ? { ...m, texto: 'Hubo un error al consultar. ¿El backend está corriendo?', cargando: false } : m
            ));
        } finally {
            setCargando(false);
        }
    };

    const limpiar = () => {
        setMensajes([{
            id: nextId.current++,
            rol: 'bot',
            texto: '¡Hola! Soy el experto de **Ai.nance** 👋\n\nPodés preguntarme sobre plataformas de cobro, comisiones, el dólar blue o cómo optimizar tus cobros como freelancer argentino.',
        }]);
    };

    const handleAbrir = () => {
        setAbierto(true);
        setPuntito(false);
    };

    return (
        <>
            {/* ── Panel del chat ── */}
            <div className={`
                fixed z-50 transition-all duration-300 ease-in-out
                /* Mobile: bottom sheet */
                bottom-0 left-0 right-0
                /* Desktop: panel flotante esquina */
                sm:bottom-24 sm:right-5 sm:left-auto sm:w-[370px]
                ${abierto
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-4 pointer-events-none'
                }
            `}>
                <div className="
                    bg-white flex flex-col shadow-2xl border border-slate-200
                    /* Mobile: ocupa pantalla completa con bordes arriba */
                    rounded-t-2xl max-h-[85vh]
                    /* Desktop: card flotante con todos los bordes */
                    sm:rounded-2xl sm:max-h-[520px]
                ">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center justify-between rounded-t-2xl shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm leading-tight">Experto Ai.nance</p>
                                <p className="text-blue-200 text-xs">Powered by Gemini ✦</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={limpiar}
                                title="Limpiar conversación"
                                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <Trash2 size={15} />
                            </button>
                            <button
                                onClick={() => setAbierto(false)}
                                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                        {mensajes.map(m => (
                            <div key={m.id} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.rol === 'bot' && (
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 mr-2">
                                        <Sparkles size={12} className="text-blue-600" />
                                    </div>
                                )}
                                <div className={`
                                    max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                                    ${m.rol === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                                    }
                                `}>
                                    {m.cargando ? (
                                        <div className="flex items-center gap-1 py-0.5">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    ) : m.rol === 'bot' ? (
                                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-slate-800">
                                            <Markdown>{m.texto}</Markdown>
                                        </div>
                                    ) : (
                                        m.texto
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Sugerencias (solo si hay 1 mensaje, el de bienvenida) */}
                    {mensajes.length === 1 && (
                        <div className="px-4 pb-2 flex flex-col gap-1.5 shrink-0">
                            {SUGERENCIAS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => enviar(s)}
                                    className="text-left text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-medium border border-blue-100"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-4 pb-6 sm:pb-4 pt-2 shrink-0 border-t border-slate-100">
                        <div className="flex gap-2 items-center">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && enviar(input)}
                                placeholder="Hacé tu pregunta..."
                                disabled={cargando}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                            />
                            <button
                                onClick={() => enviar(input)}
                                disabled={!input.trim() || cargando}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-2.5 rounded-xl transition-colors shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Botón flotante (oculto en mobile cuando el chat está abierto) ── */}
            <button
                onClick={abierto ? () => setAbierto(false) : handleAbrir}
                className={`
                    fixed bottom-5 right-5 z-50
                    w-14 h-14 rounded-full shadow-xl transition-all duration-300
                    items-center justify-center
                    ${abierto
                        ? 'hidden sm:flex bg-slate-700 hover:bg-slate-800'
                        : 'flex bg-blue-600 hover:bg-blue-700 hover:scale-110'
                    }
                `}
            >
                {abierto
                    ? <X size={22} className="text-white" />
                    : <Bot size={24} className="text-white" />
                }

                {/* Puntito de notificación */}
                {puntito && !abierto && (
                    <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            {/* Overlay en mobile cuando está abierto */}
            {abierto && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 sm:hidden"
                    onClick={() => setAbierto(false)}
                />
            )}
        </>
    );
}
