import { TiposContratos } from './EnumTiposContratos';
import { InfoContrato } from './infoContrato';

export interface SolicitudContrato {
    infoContrato: InfoContrato,
    tipoContrato: TiposContratos
}