import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

export const getPlataformas = () => api.get('/plataformas');
export const getCotizaciones = () => api.get('/cotizaciones');
export const realizarCalculo = (montoBruto: number, plataformaId: string) => 
    api.post('/calculos', { montoBruto, plataformaId });