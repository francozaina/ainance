const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Plataforma = require('../models/Plataforma');
const Gasto = require('../models/Gasto');
const User = require('../models/User');
const { obtenerCotizaciones } = require('../services/dolarService');
const { generarRecomendacion } = require('../services/aiService');

router.post('/', async (req, res) => {
    const { mensaje } = req.body;

    try {
        // Contexto base: plataformas y cotizaciones
        const [plataformas, cotizaciones] = await Promise.all([
            Plataforma.find(),
            obtenerCotizaciones()
        ]);

        // Intentar obtener gastos del usuario si hay token (opcional, no bloquea)
        let gastosUsuario = [];
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const hoy = new Date();
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                gastosUsuario = await Gasto.find({
                    usuario: decoded.id,
                    fecha: { $gte: inicioMes }
                }).sort({ fecha: 1 }).lean();
            } catch {
                // Token inválido o expirado, continuamos sin gastos
            }
        }

        const respuestaIA = await generarRecomendacion(mensaje, plataformas, cotizaciones, gastosUsuario);

        res.json({ respuesta: respuestaIA });
    } catch (error) {
        console.error("ERROR EN RUTA CHAT:", error.message);
        res.status(500).json({ mensaje: "Error interno", error: error.message });
    }
});

module.exports = router;