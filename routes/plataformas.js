const express = require('express');
const router = express.Router();
const Plataforma = require('../models/Plataforma');

// @route   POST /api/plataformas
// @desc    Crear una nueva plataforma (ej. PayPal)
router.post('/', async (req, res) => {
    try {
        const nuevaPlataforma = new Plataforma(req.body);
        const plataformaGuardada = await nuevaPlataforma.save();
        res.status(201).json(plataformaGuardada);
    } catch (error) {
        console.error(error);
        res.status(400).json({ mensaje: 'Error al crear la plataforma', error: error.message });
    }
});

// @route   GET /api/plataformas
// @desc    Obtener todas las plataformas
router.get('/', async (req, res) => {
    try {
        const plataformas = await Plataforma.find();
        res.json(plataformas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener plataformas' });
    }
});

module.exports = router;