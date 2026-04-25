const express = require('express');
const router = express.Router();
const { obtenerCotizaciones } = require('../services/dolarService');

// @route   GET /api/cotizaciones
// @desc    Obtener valores actuales del dólar en Argentina
router.get('/', async (req, res) => {
    try {
        const datos = await obtenerCotizaciones();
        res.json(datos);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

module.exports = router;