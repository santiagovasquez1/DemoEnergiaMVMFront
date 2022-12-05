export enum EstadoAcuerdo {
    pendiente,
    activo,
    cerrado
}


export interface AcuerdoEnergia {
    dirCliente: string; 
    dirGenerador: string;
    dirComercializador: string;
    tipoEnergia: string; //
    cantidadEnergiaTotal: number; //
    cantidadEnergiaInyectada: number; //
    fechaSolicitud: number;
    fechaInicio: number; //
    fechaFin: number; //
    estadoAcuerdo: EstadoAcuerdo;
    indexCliente: number;
    indexGlobal: number;
}