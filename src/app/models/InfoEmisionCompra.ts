export enum EstadoCompra {
    pendiente,
    aprobada
}

export interface InfoEmisionCompra {
    ownerCliente: string;
    dirContratoCliente: string,
    empresaCliente: string,
    tipoEnergia: string,
    cantidadDeEnergia: number,
    estado: EstadoCompra,
    fechaEmision: string,
    fechaAprobacion: string,
    index: number
}