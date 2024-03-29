import { EstadoAcuerdo } from './../models/AcuerdoEnergia';
import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, throwError } from 'rxjs';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Web3ConnectService } from './web3-connect.service';
import { WinRefService } from './win-ref.service';
import { Contract } from 'web3-eth-contract';
import Acuerdo from '../../../buildTruffle/contracts/AcuerdosLedger.json';
import { AcuerdoEnergia } from '../models/AcuerdoEnergia';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export abstract class AcuerdoContractService {

  contract: Contract | undefined;
  account: any;
  adressContract: any;
  web3: Web3;
  constructor(private winRef: WinRefService,
    private web3ConnectService: Web3ConnectService) { }

  async loadBlockChainContractData() {
    await this.web3ConnectService.loadWeb3();
    this.web3 = this.winRef.window.web3 as Web3;


    const networkId = await this.web3.eth.net.getId();
    const networkData = Acuerdo.networks[networkId];
    if (networkData) {
      const abi = Acuerdo.abi;
      this.adressContract = networkData.address;
      this.contract = new this.web3.eth.Contract(abi as unknown as AbiItem, this.adressContract);
      this.account = localStorage.getItem('account');
      localStorage.setItem('addressRegulador', this.adressContract);
    } else {
      window.alert('Esta aplicación no está disponible en este network.');
    }

  }

  getAcuerdosDeCompraMercado(): Observable<AcuerdoEnergia[]> {
    return from(this.contract?.methods.getAcuerdosDeCompraMercado().call({ from: this.account }))
      .pipe(
        map((data: any) => {
          return this.mappingAcuerdosDeCompra(data);
        }),
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
  }

  getAcuerdosDeCompraByCliente(address: string): Observable<AcuerdoEnergia[]> {
    return from(this.contract.methods.getAcuerdosByCliente(address).call({ from: this.account }))
      .pipe(
        map((data: any[]) => {
          return this.mappingAcuerdosDeCompra(data);
        }),
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
  }

  getAcuerdosDeCompraByComercializador(address: string) {
    return from(this.contract.methods.getAcuerdosByComercializador(address).call({ from: this.account }))
      .pipe(
        map((data: any[]) => {
          return this.mappingAcuerdosDeCompra(data);
        }),
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
  }

  getAcuerdosDeCompraByGenerador(address: string): Observable<AcuerdoEnergia[]> {
    return from(this.contract.methods.getAcuerdosByGenerador(address).call({ from: this.account }))
      .pipe(
        map((data: any[]) => {
          return this.mappingAcuerdosDeCompra(data);
        }),
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
  }

  liquidacionContrato(index: number): Observable<any> {
    return from(this.contract.methods.liquidacionContrato(index).send({ from: this.account })).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  private mappingAcuerdosDeCompra(data: any[]) {
    const acuerdosTemp = data.map(item => {
      const [
        dataCliente, dataGenerador, dataComercializador, tipoEnergia, cantidadEnergiaTotal, cantidadEnergiaInyectada, fechaSolicitud, fechaInicio, fechaFin, estadoAcuerdo, indexGlobal, valorContrato
      ] = item;

      const [dirCliente, nombreCliente] = dataCliente
      const [dirGenerador, nombreGenerador] = dataGenerador
      const [dirComercializador, nombreComercializador] = dataComercializador

      let temAcuerdo: AcuerdoEnergia = {
        dataCliente: {
          dirContrato: dirCliente,
          nombreAgente: nombreCliente
        },
        dataGenerador: {
          dirContrato: dirGenerador,
          nombreAgente: nombreGenerador
        },
        dataComercializador: {
          dirContrato: dirComercializador,
          nombreAgente: nombreComercializador
        },
        tipoEnergia,
        cantidadEnergiaTotal: parseInt(cantidadEnergiaTotal),
        cantidadEnergiaInyectada: parseInt(cantidadEnergiaInyectada),
        fechaSolicitud: moment(parseInt(fechaSolicitud) * 1000).format('DD/MM/YYYY'),
        fechaInicio: moment(parseInt(fechaInicio) * 1000).format('DD/MM/YYYY'),
        fechaFin: moment(parseInt(fechaFin) * 1000).format('DD/MM/YYYY'),
        estadoAcuerdo:parseInt(estadoAcuerdo) as EstadoAcuerdo,
        indexGlobal: parseInt(indexGlobal),
        valorContrato: parseInt(valorContrato)
      };
      return temAcuerdo;
    });

    return acuerdosTemp as AcuerdoEnergia[];
  }

}
