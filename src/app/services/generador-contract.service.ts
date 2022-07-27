import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AgenteContractService } from './agente-contract.service';
import Generador from '../../../build/contracts/Generador.json';
import { catchError, from, map, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneradorContractService extends AgenteContractService {

  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(Generador, web3);
  }

  postCrearNuevaEnergia(tipoEnergia: string, cantidad: number): Observable<any> {
    return from(this.contract?.methods.GenerarNuevaEnergia(tipoEnergia, cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        console.log("error en el service")
        return throwError(() => new Error(error.message));
      })
    );
  }

  postInyectarEnergia(tipoEnergia: string, cantidad: number): Observable<any> {
    return from(this.contract?.methods.InyectarEnergia(tipoEnergia, cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        console.log("error en el service")
        return throwError(() => new Error(error.message));
      })
    );
  }

  postContratarComercializador(addresComercializador: string): Observable<any> {
    return from(this.contract?.methods.contratarComercializador(addresComercializador).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    )
  }

  getTipoEnergia(tipoEnergia: string): Observable<any> {
    return from(this.contract?.methods.getTipoEnergia(tipoEnergia).call({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    )
  }

  getCantidadEnergia(tipoEnergia: string): Observable<number> {
    return from(this.contract?.methods.getCantidadEnergia(tipoEnergia).call({ from: this.account })).pipe(
      map((data: any) => {
        return parseInt(data);
      }),
      catchError((error) => {
        console.error(error);
        return of(0);
      })
    )
  }

}
