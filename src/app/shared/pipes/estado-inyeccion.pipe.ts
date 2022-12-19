import { EstadoInyeccion } from './../../models/infoInyeccionBanco';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoInyeccion'
})
export class EstadoInyeccionPipe implements PipeTransform {

  transform(value: string | EstadoInyeccion): string {
    let estadoInyeccion: EstadoInyeccion;
    if (typeof value == 'string') {
      estadoInyeccion = parseInt(value) as EstadoInyeccion;
    } else {
      estadoInyeccion = value as EstadoInyeccion;
    }

    switch (estadoInyeccion) {
      case EstadoInyeccion.liquidado:
        return 'Liquidado';
      case EstadoInyeccion.pendiente:
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

}
