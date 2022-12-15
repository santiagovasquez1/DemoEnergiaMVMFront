import { InfoPlantaEnergia } from './InfoPlantaEnergia';
import { InfoEnergia } from './InfoEnergia';
export enum EstadoInyeccion {
    pendiente,
    liquidado
}
export interface InfoInyeccionBanco {
    infoEnergia: InfoEnergia;
    infoPlanta: InfoPlantaEnergia;
    dirContratoGenerador: string;
    ownerGenerador: string;
    nombreGenerador: string;
    precioEnergia: number;
    fechaInyeccion: string;
    estadoInyeccion: EstadoInyeccion;
}
