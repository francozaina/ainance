const express = require('express');
const router = express.Router();
const Gasto = require('../models/Gasto');
const { protegerRuta } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// @route   GET /api/gastos?mes=5&anio=2026
// @desc    Obtener gastos del usuario (filtrados por mes/año)
router.get('/', async (req, res) => {
    try {
        const { mes, anio } = req.query;
        let filtro = { usuario: req.user._id };

        if (mes && anio) {
            const inicio = new Date(anio, mes - 1, 1);
            const fin = new Date(anio, mes, 1);
            filtro.fecha = { $gte: inicio, $lt: fin };
        }

        const gastos = await Gasto.find(filtro).sort({ fecha: -1 });
        res.json(gastos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener gastos', error: error.message });
    }
});

// @route   POST /api/gastos
// @desc    Crear un nuevo gasto
router.post('/', async (req, res) => {
    try {
        const { fecha, monto, descripcion, categoria, moneda } = req.body;

        if (!fecha || !monto || !descripcion || !categoria) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        const gasto = await Gasto.create({
            usuario: req.user._id,
            fecha: new Date(fecha),
            monto: Number(monto),
            descripcion,
            categoria,
            moneda: moneda || 'ARS'
        });

        res.status(201).json(gasto);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors).map(e => e.message)[0];
            return res.status(400).json({ mensaje: msg });
        }
        res.status(500).json({ mensaje: 'Error al crear gasto', error: error.message });
    }
});

// @route   DELETE /api/gastos/:id
// @desc    Eliminar un gasto
router.delete('/:id', async (req, res) => {
    try {
        const gasto = await Gasto.findOne({ _id: req.params.id, usuario: req.user._id });
        if (!gasto) {
            return res.status(404).json({ mensaje: 'Gasto no encontrado' });
        }
        await gasto.deleteOne();
        res.json({ mensaje: 'Gasto eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar gasto', error: error.message });
    }
});

// @route   GET /api/gastos/resumen
// @desc    Resumen por categoría del mes actual
router.get('/resumen', async (req, res) => {
    try {
        const { mes, anio } = req.query;
        const mesNum = parseInt(mes) || new Date().getMonth() + 1;
        const anioNum = parseInt(anio) || new Date().getFullYear();

        const inicio = new Date(anioNum, mesNum - 1, 1);
        const fin = new Date(anioNum, mesNum, 1);

        const resumen = await Gasto.aggregate([
            {
                $match: {
                    usuario: req.user._id,
                    fecha: { $gte: inicio, $lt: fin }
                }
            },
            {
                $group: {
                    _id: '$categoria',
                    total: { $sum: '$monto' },
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const totalMes = resumen.reduce((acc, r) => acc + r.total, 0);
        res.json({ resumen, totalMes });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener resumen', error: error.message });
    }
});

module.exports = router;
