const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protegerRuta } = require('../middleware/auth');

// Helper para generar token
const generarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
// @access  Public
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    try {
        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        // Verificar si el email ya existe
        const usuarioExistente = await User.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'Ya existe una cuenta con ese email' });
        }

        // Crear usuario (el password se hashea en el modelo)
        const usuario = await User.create({ nombre, email, password });

        const token = generarToken(usuario._id);

        res.status(201).json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error('ERROR EN REGISTER:', error); // 👈 esto te va a mostrar qué pasa
        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: mensajes[0] });
        }
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
}
});

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario incluyendo password (select: false por default)
        const usuario = await User.findOne({ email }).select('+password');
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const passwordOk = await usuario.compararPassword(password);
        if (!passwordOk) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const token = generarToken(usuario._id);

        res.json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Obtener usuario autenticado actual
// @access  Private
router.get('/me', protegerRuta, async (req, res) => {
    res.json({
        usuario: {
            id: req.user._id,
            nombre: req.user.nombre,
            email: req.user.email
        }
    });
});

module.exports = router;
