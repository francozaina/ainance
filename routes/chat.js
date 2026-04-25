const express = require('express');
const router = express.Router();
const Plataforma = require('../models/Plataforma');
const { obtenerCotizaciones } = require('../services/dolarService');
const { generarRecomendacion } = require('../services/aiService');

router.post('/', async (req, res) => {
    const { mensaje } = req.body;

    try {
        const plataformas = await Plataforma.find();
        const cotizaciones = await obtenerCotizaciones();
        const dolarBlue = cotizaciones.find(d => d.nombre === 'Blue').venta;

        const respuestaIA = await generarRecomendacion(mensaje, plataformas, dolarBlue);
        
        res.json({ respuesta: respuestaIA });
    } catch (error) {
        // ESTA LÍNEA ES LA QUE TE VA A DECIR LA VERDAD EN LA TERMINAL
        console.error("ERROR EN RUTA CHAT:", error.message);
        
        res.status(500).json({ mensaje: "Error interno", error: error.message });
    }
});

module.exports = router;