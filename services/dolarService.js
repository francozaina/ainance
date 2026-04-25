const axios = require('axios');

const obtenerCotizaciones = async () => {
    try {
        // Usamos la API gratuita de DolarApi
        const respuesta = await axios.get('https://dolarapi.com/v1/dolares');
        
        // La API devuelve un array con Blue, Oficial, MEP, etc.
        // Vamos a filtrar para quedarnos con los que nos interesan
        const cotizaciones = respuesta.data.map(dolar => ({
            nombre: dolar.nombre,
            venta: dolar.venta,
            fecha: dolar.fechaActualizacion
        }));

        return cotizaciones;
    } catch (error) {
        console.error('Error al obtener el dólar:', error.message);
        throw new Error('No se pudo obtener la cotización');
    }
};

module.exports = { obtenerCotizaciones };