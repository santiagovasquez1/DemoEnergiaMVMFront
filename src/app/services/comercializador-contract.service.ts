import { InfoEmisionCompra } from './../models/InfoEmisionCompra';
import { InfoContrato } from './../models/infoContrato';
import { CompraEnergiaRequest } from './../models/CompraEnergiaRequest';
import { catchError, map, Observable, throwError, switchMap, forkJoin, from } from 'rxjs';
import { Injectable } from '@angular/core';
import { AgenteContractService } from './agente-contract.service';
import Comercializador from '../../../buildTruffle/contracts/Comercializador.json';
import Web3 from 'web3';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ComercializadorContractService extends AgenteContractService {
  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(Comercializador, web3);
  }

  getClientesComercializador(): Observable<InfoContrato[]> {
    return from(this.contract.methods.getClientesComercializador().call({ from: this.account })).pipe(
      map((data: any) => {
        let infoContratos = data.map(infoContrato => {
          const [
            dirContrato,
            owner,
            nit,
            empresa,
            contacto,
            telefono,
            correo,
            departamento,
            ciudad,
            direccion,
            comercializador,
            tipoComercio
          ] = infoContrato

          let tempInfo: InfoContrato = {
            dirContrato,
            owner,
            nit,
            empresa,
            contacto,
            telefono,
            correo,
            departamento,
            ciudad,
            direccion,
            comercializador,
            tipoComercio
          }
          return tempInfo;
        });
        return infoContratos as InfoContrato[];
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getEnergiaDisponible(tipoEnergia: string, cliente: string): Observable<any> {
    return from(this.contract.methods.getEnergiaDisponible(tipoEnergia, cliente).call({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  ComprarEnergia(compraEnergiaRequest: CompraEnergiaRequest): Observable<any> {
    return from(this.contract.methods.ComprarEnergia(compraEnergiaRequest.dirContratoGenerador, compraEnergiaRequest.ownerCliente,
      compraEnergiaRequest.cantidadEnergia, compraEnergiaRequest.tipoEnergia,
      compraEnergiaRequest.index).send({ from: this.account })).pipe(
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
  }

  getEmisionesDeCompra(): Observable<InfoEmisionCompra[]> {
    return from(this.contract.methods.contadorEmisiones().call({ from: this.account })).pipe(
      switchMap((data: string) => {
        let numEmisiones = parseInt(data);
        let observables: Observable<InfoEmisionCompra>[] = [];
        for (let i = numEmisiones - 1; i >= 0; i--) {
          let tempObs = from(this.contract.methods.getInfoEmisionesDeCompra(i).call({ from: this.account })).pipe(
            map((data: any) => {
              const [
                ownerCliente,
                dirContratoCliente,
                empresaCliente,
                tipoEnergia,
                cantidadDeEnergia,
                estado,
                fechaEmision,
                fechaAprobacion,
                index
              ] = data;

              let tempInfo: InfoEmisionCompra = {
                ownerCliente,
                dirContratoCliente,
                empresaCliente,
                tipoEnergia,
                cantidadDeEnergia,
                estado,
                fechaEmision: moment(parseInt(fechaEmision) * 1000).format('DD/MM/YYYY HH:mm:ss'),
                fechaAprobacion: moment(parseInt(fechaAprobacion) * 1000).format('DD/MM/YYYY HH:mm:ss'),
                index
              }
              return tempInfo;
            })
          );
          observables.push(tempObs);
        }
        return forkJoin(observables);
      })
    )
  }
}
