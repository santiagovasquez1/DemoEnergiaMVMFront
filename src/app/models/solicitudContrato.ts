import { TiposContratos } from './EnumTiposContratos';
import { InfoContrato } from './infoContrato';

export enum EstadoSolicitud {
    aprobada,
    rechazada,
    pendiente
}
export interface SolicitudContrato {
    idSolicitud:string;
    infoContrato: InfoContrato;
    tipoContrato: TiposContratos;
    estadoSolicitud: EstadoSolicitud;
    fechaSolicitud: string;
    fechaAprobacion :string;
}