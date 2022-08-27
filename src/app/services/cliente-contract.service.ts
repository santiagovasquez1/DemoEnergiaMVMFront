import { InfoEnergia } from './../models/InfoEnergia';
import { Observable, catchError, throwError, map, from, of } from 'rxjs';
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { AgenteContractService } from './agente-contract.service';
import Cliente from '../../../buildTruffle/contracts/Cliente.json';

@Injectable({
  providedIn: 'root'
})
export class ClienteContractService extends AgenteContractService {

  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(Cliente, web3);
  }

  postContratarComercializador(addresComercializador: string): Observable<any> {
    return from(this.contract?.methods.contratarComercializador(addresComercializador).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  postComprarEnergia(tipoEnergia: string, cantidad: number): Observable<any> {
    return from(this.contract?.methods.comprarEnergia(tipoEnergia, cantidad).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  postConsumirEnergia (tipoEnergia: string, cantidad: number):Observable<any>{
    return from(this.contract?.methods.gastoEnergia(tipoEnergia, cantidad).send({from: this.account})).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getEnergiaCliente(tipoEnergia: string): Observable<InfoEnergia> {
    return from(this.contract?.methods.getEnergiaCliente(tipoEnergia).call({ from: this.account })).pipe(
      map((data: any) => {
        const [nombre, cantidadEnergia, precio] = data;
        let tempInfo: InfoEnergia = {
          nombre: nombre,
          cantidadEnergia: cantidadEnergia,
          precio: precio
        }
        return tempInfo;
      }),
      catchError((error) => {
        let tempInfo: InfoEnergia = {
          nombre: '',
          cantidadEnergia: 0,
          precio: 0
        }
        console.error(error);
        return of(tempInfo);
      })
    );
  }
}
