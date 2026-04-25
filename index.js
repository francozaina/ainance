const express = require('express');
const cors = require('cors');
const conectarDB = require('./db');
require('dotenv').config();

const app = express();

// Conexión a MongoDB Atlas
conectarDB();

// Middlewares
app.use(cors());
app.use(express.json());

// RUTAS
app.use('/api/plataformas', require('./routes/plataformas'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/calculos', require('./routes/calculos'));
app.use('/api/chat', require('./routes/chat')); // ✅ Nueva ruta de IA integrada

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});