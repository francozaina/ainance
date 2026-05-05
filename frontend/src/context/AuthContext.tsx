import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Usuario {
    id: string;
    nombre: string;
    email: string;
}

interface AuthContextType {
    usuario: Usuario | null;
    token: string | null;
    cargando: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (nombre: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    // Al montar, intentar recuperar sesión del localStorage
    useEffect(() => {
        const tokenGuardado = localStorage.getItem('ainance_token');
        if (tokenGuardado) {
            setToken(tokenGuardado);
            axios.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;
            // Verificar que el token sigue siendo válido
            axios.get(`${API_URL}/api/auth/me`)
                .then(res => {
                    setUsuario(res.data.usuario);
                })
                .catch(() => {
                    // Token expirado o inválido, limpiar
                    localStorage.removeItem('ainance_token');
                    setToken(null);
                    delete axios.defaults.headers.common['Authorization'];
                })
                .finally(() => setCargando(false));
        } else {
            setCargando(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        const { token: nuevoToken, usuario: nuevoUsuario } = res.data;
        localStorage.setItem('ainance_token', nuevoToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
    };

    const register = async (nombre: string, email: string, password: string) => {
        const res = await axios.post(`${API_URL}/api/auth/register`, { nombre, email, password });
        const { token: nuevoToken, usuario: nuevoUsuario } = res.data;
        localStorage.setItem('ainance_token', nuevoToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
    };

    const logout = () => {
        localStorage.removeItem('ainance_token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{
            usuario,
            token,
            cargando,
            login,
            register,
            logout,
            estaAutenticado: !!usuario
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
}
