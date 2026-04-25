export interface Plataforma {
    _id: string;
    nombre: string;
    comisionPorcentaje: number;
    comisionFija: number;
    moneda: string;
}

export interface ResultadoCalculo {
    plataforma: string;
    montoBrutoUSD: number;
    desglose: {
        comisionPorcentaje: string;
        comisionFija: string;
        totalComisiones: number;
    };
    netoFinal: {
        USD: string;
        ARS: number;
        cotizacionUsada: number;
    };
}