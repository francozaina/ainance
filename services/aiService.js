const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const generarRecomendacion = async (preguntaUsuario, contextoPlataformas, cotizaciones, gastosUsuario = []) => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Formatear cotizaciones para el prompt
    const cotizacionesTexto = cotizaciones.map(c =>
        `${c.nombre}: $${c.venta} ARS`
    ).join(', ');

    const dolarBlue = cotizaciones.find(c =>
        c.nombre?.toLowerCase().includes('blue')
    )?.venta || 'no disponible';

    // Formatear gastos del usuario si existen
    let gastosTexto = 'El usuario no tiene gastos registrados este mes (no inició sesión o no cargó gastos).';
    if (gastosUsuario.length > 0) {
        const hoy = new Date();
        const mesAnio = hoy.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

        // Agrupar por categoría
        const porCategoria = {};
        let totalARS = 0;
        gastosUsuario.forEach(g => {
            const monto = g.moneda === 'USD' ? g.monto * Number(dolarBlue) : g.monto;
            porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + monto;
            totalARS += monto;
        });

        const resumenCategorias = Object.entries(porCategoria)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, total]) => `${cat}: $${Math.round(total).toLocaleString('es-AR')} ARS`)
            .join(', ');

        const listaGastos = gastosUsuario.map(g =>
            `- ${new Date(g.fecha).toLocaleDateString('es-AR')}: ${g.descripcion} (${g.categoria}) — ${g.moneda === 'USD' ? `U$D${g.monto}` : `$${g.monto}`}`
        ).join('\n');

        gastosTexto = `El usuario tiene ${gastosUsuario.length} gastos registrados en ${mesAnio}:
Total del mes: $${Math.round(totalARS).toLocaleString('es-AR')} ARS equivalente.
Por categoría: ${resumenCategorias}.
Detalle:
${listaGastos}`;
    }

    const promptSystem = `
Eres el experto financiero de Ai.nance, una app para freelancers argentinos.

**PLATAFORMAS DE COBRO DISPONIBLES:**
${JSON.stringify(contextoPlataformas, null, 2)}

**COTIZACIONES DEL DÓLAR HOY:**
${cotizacionesTexto}
(Usá el dólar Blue = $${dolarBlue} ARS para conversiones salvo que el usuario pida otra)

**GASTOS DEL USUARIO ESTE MES:**
${gastosTexto}

**INSTRUCCIONES:**
- Respondé de forma clara, breve y con buen humor argentino (nada de ser solemne).
- Si el usuario pregunta por sus gastos, usá SOLO los datos reales que te pasé arriba.
- Si pregunta cuánto gastó en una categoría o en total, calculalo con los datos reales.
- Si pregunta qué plataforma le conviene, calculá siempre el neto final con comisiones.
- Si menciona un monto en USD, convertilo a ARS usando el dólar Blue.
- Si no tenés datos de gastos del usuario, decíselo y sugerile que inicie sesión y cargue sus gastos.
- Nunca inventes datos que no tenés.
- Usá markdown para formatear (negrita, listas) cuando ayude a la claridad.
    `;

    try {
        const result = await modelo.generateContent([promptSystem, preguntaUsuario]);
        return result.response.text();
    } catch (error) {
        console.error("Error detallado de Gemini:", error);
        throw error;
    }
};

module.exports = { generarRecomendacion };