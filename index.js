const express = require('express');
const cors = require('cors');
const conectarDB = require('./db');
require('dotenv').config();

const app = express();

// Conexión a MongoDB Atlas
conectarDB();

// Middlewares
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ainance-blond.vercel.app"
  ]
}));
app.use(express.json());

// RUTAS
app.use('/api/auth', require('./routes/auth'));
app.use('/api/plataformas', require('./routes/plataformas'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/calculos', require('./routes/calculos'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/gastos', require('./routes/gastos'));

// MODIFICACIÓN: Evitamos que app.listen bloquee el despliegue en Vercel
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    });
}
// Debajo de los middlewares y antes de las otras rutas
app.get('/', (req, res) => {
    res.send('🚀 Ainance API funcionando correctamente');
});
// MODIFICACIÓN: Exportamos la app para las Serverless Functions de Vercel
module.exports = app;
