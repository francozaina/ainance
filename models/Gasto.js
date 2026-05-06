const mongoose = require('mongoose');

const GastoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fecha: {
        type: Date,
        required: true
    },
    monto: {
        type: Number,
        required: true,
        min: [0, 'El monto no puede ser negativo']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        maxlength: [100, 'La descripción no puede superar los 100 caracteres']
    },
    categoria: {
        type: String,
        required: true,
        enum: [
            'Comida',
            'Transporte',
            'Entretenimiento',
            'Salud',
            'Ropa',
            'Tecnología',
            'Educación',
            'Servicios',
            'Hogar',
            'Otros'
        ],
        default: 'Otros'
    },
    moneda: {
        type: String,
        enum: ['ARS', 'USD'],
        default: 'ARS'
    }
}, { timestamps: true });

module.exports = mongoose.model('Gasto', GastoSchema);
