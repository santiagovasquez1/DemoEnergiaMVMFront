export enum EstadoPlanta{
    activa,
    inactiva
}

export interface InfoPlantaEnergia {
    dirPlanta: string;
    nombre: string;
    departamento: string;
    ciudad: string;
    coordenadas: string;
    fechaInicio: string;
    tasaEmision: number;
    isRec: boolean;
    capacidadNominal: number;
    estado: EstadoPlanta;
}