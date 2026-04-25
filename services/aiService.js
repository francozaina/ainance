const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const generarRecomendacion = async (preguntaUsuario, contextoPlataformas, cotizacionDolar) => {
    // Inicializamos adentro para asegurar que process.env ya tenga la clave
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptSystem = `
        Eres un experto en finanzas para freelancers argentinos. 
        Tu base de datos actual de plataformas es: ${JSON.stringify(contextoPlataformas)}.
        La cotización del dólar blue hoy es: ${cotizacionDolar} ARS.
        
        Responde a la duda del usuario de forma breve, profesional y con un toque de humor argentino. 
        Calcula siempre el neto final si el usuario menciona un monto.
    `;

    try {
        const result = await modelo.generateContent([promptSystem, preguntaUsuario]);
        return result.response.text();
    } catch (error) {
        console.error("Error detallado de Gemini:", error);
        throw error; // Re-lanzamos para que lo ataje el catch de la ruta
    }
};

module.exports = { generarRecomendacion };