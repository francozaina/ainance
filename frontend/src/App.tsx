import { useState, useEffect } from 'react';
import axios from 'axios';
import Markdown from 'react-markdown';
import type { Plataforma, ResultadoCalculo } from './types';
import { 
  Wallet, 
  Calculator, 
  ArrowRight, 
  DollarSign, 
  Info, 
  Sparkles, 
  MessageSquare, 
  Send 
} from 'lucide-react';

// MODIFICACIÓN: Definimos la URL de la API dinámicamente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  // --- Estados de la Calculadora ---
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [monto, setMonto] = useState<number>(0);
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState<string>('');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);

  // --- Estados del Chatbot IA ---
  const [mensajeChat, setMensajeChat] = useState('');
  const [respuestaIA, setRespuestaIA] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);

  // Carga inicial de datos usando la constante API_URL
  useEffect(() => {
    axios.get(`${API_URL}/api/plataformas`)
      .then(res => setPlataformas(res.data))
      .catch((err: any) => console.error("Error cargando plataformas:", err));
  }, []);

  // Lógica de cálculo manual usando la constante API_URL
  const handleCalcular = async () => {
    if (monto > 0 && plataformaSeleccionada) {
      try {
        const res = await axios.post(`${API_URL}/api/calculos`, {
          montoBruto: monto,
          plataformaId: plataformaSeleccionada
        });
        setResultado(res.data);
      } catch (err: any) {
        alert("Error al calcular. Revisá que el backend esté corriendo.");
      }
    }
  };

  // Lógica de consulta a la IA usando la constante API_URL
  const handlePreguntarIA = async () => {
    if (!mensajeChat.trim()) return;
    
    setCargandoIA(true);
    setRespuestaIA('');
    try {
      const res = await axios.post(`${API_URL}/api/chat`, { mensaje: mensajeChat });
      setRespuestaIA(res.data.respuesta);
    } catch (err: any) {
      setRespuestaIA("Che, hubo un problema conectando con el experto. ¿Tenés el backend prendido?");
    } finally {
      setCargandoIA(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wallet className="text-blue-600" size={32} />
          <h1 className="text-3xl font-extrabold tracking-tight italic">Ai.nance</h1>
        </div>
        <p className="text-slate-500 font-medium tracking-tight">
          Orquestador de cobros inteligentes con IA
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        
        {/* SECCIÓN 1: CALCULADORA MANUAL */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
              <Calculator size={20} className="text-blue-500" />
              Configurar Operación
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Monto Bruto (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="0.00"
                    onChange={(e) => setMonto(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Plataforma de Cobro</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  onChange={(e) => setPlataformaSeleccionada(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {plataformas.map(p => (
                    <option key={p._id} value={p._id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCalcular}
                disabled={!monto || !plataformaSeleccionada}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                Calcular Resultados <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between min-h-[300px]">
            {resultado ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Neto a recibir</p>
                    <h3 className="text-5xl font-bold mt-1 text-white">${resultado.netoFinal.USD}</h3>
                    <p className="text-blue-400 font-medium mt-1 uppercase text-xs tracking-widest">USD Netos</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl">
                    <DollarSign className="text-blue-400" />
                  </div>
                </div>

                <div className="space-y-4 mb-8 text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-xs">Comisión ({resultado.desglose.comisionPorcentaje})</span>
                    <span className="font-mono">-${(resultado.montoBrutoUSD * parseFloat(resultado.desglose.comisionPorcentaje) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-xs">Costo fijo plataforma</span>
                    <span className="font-mono">-{resultado.desglose.comisionFija}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 text-green-400">
                    <span>Equivalente en Pesos (Blue)</span>
                    <span>${resultado.netoFinal.ARS.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl flex gap-3 items-center text-xs text-slate-400 border border-slate-700/50">
                  <span className="shrink-0"><Info size={16} /></span>
                  <p>Cotización usada: 1 USD = ${resultado.netoFinal.cotizacionUsada} ARS.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                  <Calculator size={32} />
                </div>
                <p className="max-w-[200px] text-sm">Completá los datos para ver el desglose financiero</p>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: CHATBOT IA */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Consultar al Experto Ai.nance</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MessageSquare className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="text"
                  value={mensajeChat}
                  onChange={(e) => setMensajeChat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreguntarIA()}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-slate-700"
                  placeholder="Ej: ¿Qué me conviene para cobrar 500 USD?"
                />
              </div>
              <button
                onClick={handlePreguntarIA}
                disabled={cargandoIA || !mensajeChat.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-6 rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                {cargandoIA ? 'Analizando...' : <><Send size={18} /></>}
              </button>
            </div>

            {respuestaIA && (
              <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl text-purple-900 animate-in fade-in zoom-in duration-300">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-purple-600 shrink-0 mt-1" size={18} />
                  <div className="prose prose-purple max-w-none text-purple-900 text-sm leading-relaxed">
                    <Markdown>{respuestaIA}</Markdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
