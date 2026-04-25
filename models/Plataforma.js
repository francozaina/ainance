const mongoose = require('mongoose');

const PlataformaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la plataforma es obligatorio'],
        unique: true,
        trim: true
    },
    moneda: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'ARS'] // Limitamos a estas por ahora
    },
    comisionPorcentaje: {
        type: Number,
        required: true,
        default: 0
    },
    comisionFija: {
        type: Number,
        default: 0
    },
    notas: {
        type: String,
        trim: true
    },
    urlImagen: {
        type: String, // Para el logo en el frontend después
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Plataforma', PlataformaSchema);