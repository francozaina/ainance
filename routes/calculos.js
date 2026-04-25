const express = require('express');
const router = express.Router();
const Plataforma = require('../models/Plataforma');
const { obtenerCotizaciones } = require('../services/dolarService');

// @route   POST /api/calculos
// @desc    Calcular el neto final en USD y ARS
router.post('/', async (req, res) => {
    const { montoBruto, plataformaId } = req.body;

    try {
        // 1. Buscar la plataforma para obtener sus comisiones
        const plataforma = await Plataforma.findById(plataformaId);
        if (!plataforma) {
            return res.status(404).json({ mensaje: 'Plataforma no encontrada' });
        }

        // 2. Obtener cotizaciones del dólar
        const cotizaciones = await obtenerCotizaciones();
        const dolarBlue = cotizaciones.find(d => d.nombre === 'Blue');

        // 3. Lógica matemática del Orquestador
        const comisionVariable = (montoBruto * plataforma.comisionPorcentaje) / 100;
        const montoNetoUSD = montoBruto - comisionVariable - plataforma.comisionFija;
        
        // Calculamos el total en pesos usando el Dólar Blue de hoy
        const montoNetoARS = montoNetoUSD * dolarBlue.venta;

        // 4. Devolver el desglose completo
        res.json({
            plataforma: plataforma.nombre,
            montoBrutoUSD: montoBruto,
            desglose: {
                comisionPorcentaje: `${plataforma.comisionPorcentaje}%`,
                comisionFija: `$${plataforma.comisionFija} USD`,
                totalComisiones: montoBruto - montoNetoUSD
            },
            netoFinal: {
                USD: montoNetoUSD.toFixed(2),
                ARS: Math.round(montoNetoARS),
                cotizacionUsada: dolarBlue.venta
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al realizar el cálculo', error: error.message });
    }
});

module.exports = router;