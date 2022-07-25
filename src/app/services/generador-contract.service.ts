import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AgenteContractService } from './agente-contract.service';
import Generador from '../../../build/contracts/Generador.json';
import { catchError, from, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneradorContractService extends AgenteContractService{


  async loadBlockChainContractData(): Promise<void> {
    this.dirContrato = localStorage.getItem('dirContract');
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(Generador, web3);
  }

  postCrearNuevaEnergia(tipoEnergia:string, cantidad: number): Observable<any> {
    return from(this.contract?.methods.GenerarNuevaEnergia(tipoEnergia, cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        console.log("error en el service")
        return throwError(() => new Error(error.message));
      })
    );
  }

  postInyectarEnergia(tipoEnergia:string, cantidad: number): Observable<any> {
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
  
}
