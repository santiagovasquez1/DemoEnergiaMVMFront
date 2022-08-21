import { TipoTx } from './../../models/InfoTx';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tipoTransaccion'
})
export class TipoTransaccionPipe implements PipeTransform {

  transform(value: string): string {
    const tipoTx = parseInt(value) as TipoTx;

    switch (tipoTx) {
      case TipoTx.inyeccion:
        return 'Inyección';
      case TipoTx.consumo:
        return 'Consumo';
      case TipoTx.emision:
        return 'Emisión';
      case TipoTx.venta:
        return 'Venta';
    }
  }

}
