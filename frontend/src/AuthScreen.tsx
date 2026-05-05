import { useState } from 'react';
import { Wallet, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from './context/AuthContext';

interface AuthScreenProps {
    onVolver: () => void;
}

export default function AuthScreen({ onVolver }: AuthScreenProps) {
    const { login, register } = useAuth();

    const [modo, setModo] = useState<'login' | 'register'>('login');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        if (!email || !password || (modo === 'register' && !nombre)) {
            setError('Completá todos los campos');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setCargando(true);
        try {
            if (modo === 'login') {
                await login(email, password);
            } else {
                await register(nombre, email, password);
            }
            onVolver(); // Volver al home tras autenticarse
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Ocurrió un error, intentá de nuevo';
            setError(msg);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header mínimo */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wallet className="text-blue-600" size={24} />
                        <span className="text-xl font-extrabold tracking-tight italic text-slate-900">Ai.nance</span>
                    </div>
                    <button
                        onClick={onVolver}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Volver
                    </button>
                </div>
            </header>

            {/* Contenido centrado */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Franja superior */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="text-blue-200" size={18} />
                                <span className="text-blue-100 text-sm font-medium">
                                    {modo === 'login' ? 'Bienvenido de vuelta' : 'Creá tu cuenta gratis'}
                                </span>
                            </div>
                            <h1 className="text-white text-2xl font-extrabold tracking-tight">
                                {modo === 'login' ? 'Iniciá sesión' : 'Registrate'}
                            </h1>
                            <p className="text-blue-200 text-sm mt-1">
                                {modo === 'login'
                                    ? 'Accedé a tu historial y gestor financiero'
                                    : 'Guardá tus cálculos y gestioná tus finanzas'}
                            </p>
                        </div>

                        <div className="px-8 py-6 space-y-4">
                            {/* Tabs login / registro */}
                            <div className="flex bg-slate-100 rounded-xl p-1">
                                <button
                                    onClick={() => { setModo('login'); setError(''); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        modo === 'login'
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Iniciar sesión
                                </button>
                                <button
                                    onClick={() => { setModo('register'); setError(''); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        modo === 'register'
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Registrarse
                                </button>
                            </div>

                            {/* Campo nombre (solo registro) */}
                            {modo === 'register' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 text-slate-400" size={17} />
                                        <input
                                            type="text"
                                            value={nombre}
                                            onChange={e => setNombre(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                            placeholder="Tu nombre"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Campo email */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={17} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                        placeholder="tu@email.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Campo password */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={17} />
                                    <input
                                        type={mostrarPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(p => !p)}
                                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            {/* Botón submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={cargando}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                {cargando
                                    ? 'Procesando...'
                                    : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
                            </button>

                            {/* Separador */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs text-slate-400 font-medium">o</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            {/* Link para cambiar de modo */}
                            <p className="text-center text-sm text-slate-500">
                                {modo === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
                                <button
                                    onClick={() => { setModo(modo === 'login' ? 'register' : 'login'); setError(''); }}
                                    className="text-blue-600 font-semibold hover:underline"
                                >
                                    {modo === 'login' ? 'Registrate gratis' : 'Iniciá sesión'}
                                </button>
                            </p>

                            {/* Aviso de uso sin cuenta */}
                            <p className="text-center text-xs text-slate-400 leading-relaxed pt-1">
                                La calculadora y el convertidor son{' '}
                                <button onClick={onVolver} className="text-slate-500 font-semibold hover:underline">
                                    accesibles sin cuenta
                                </button>
                                . La cuenta desbloquea el gestor de finanzas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
