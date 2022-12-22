export enum EstadoAcuerdo {
    pendiente,
    activo,
    cancelado,
    cerrado
}

export interface DataAgenteAcuerdo {
    dirContrato: string;
    nombreAgente: string;
}


export interface AcuerdoEnergia {
    dataCliente: DataAgenteAcuerdo;
    dataGenerador: DataAgenteAcuerdo;
    dataComercializador: DataAgenteAcuerdo;
    tipoEnergia: string;
    cantidadEnergiaTotal: number;
    cantidadEnergiaInyectada: number;
    fechaSolicitud: string;
    fechaInicio: string;
    fechaFin: string;
    estadoAcuerdo: EstadoAcuerdo;
    indexGlobal: number;
    valorContrato: number;
}