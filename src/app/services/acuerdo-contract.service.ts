import { Injectable } from '@angular/core';
import { InfoContrato } from './../models/infoContrato';
import { catchError, from, map, Observable, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Web3ConnectService } from './web3-connect.service';
import { WinRefService } from './win-ref.service';
import { Contract } from 'web3-eth-contract';
import { TiposContratos } from '../models/EnumTiposContratos';
import Acuerdo from '../../../buildTruffle/contracts/AcuerdosLedger.json';
import { AcuerdoEnergia } from '../models/AcuerdoEnergia';
import { AnyARecord, AnyCnameRecord } from 'dns';

@Injectable({
  providedIn: 'root'
})
export abstract class AcuerdoContractService {

  contract: Contract | undefined;
  account: any;
  adressContract: any;
  web3: Web3;
  constructor(private winRef: WinRefService, private web3ConnectService: Web3ConnectService) { }

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

  getAcuerdosDeCompraMercado(): Observable<AcuerdoEnergia>  {
    return from(this.contract?.methods.getAcuerdosDeCompraMercado().call({ from: this.account })).pipe(map((data: any) => {

      // var y: number = +data[0].fechaFin * 1000;
      // var date = new Date(y);

      // data[0].fechaFin = date;
      // let temp = {
      //   dirCliente: data.dirCliente,
      //   dirGenerador: data.dirGenerador,
      //   dirComercializador: data.dirComercializador,
      //   tipoEnergia: data.tipoEnergia,
      //   cantidadEnergiaTotal: data.cantidadEnergiaTotal,
      //   cantidadEnergiaInyectada: data.cantidadEnergiaInyectada,
      //   fechaSolicitud: data.fechaSolicitud,
      //   fechaInicio: data.fechaInicio,
      //   fechaFin: data.fechaFin,
      //   estadoAcuerdo: data.estadoAcuerdo,
      //   indexCliente: data.indexCliente,
      //   indexGlobal: data.indexGlobal
      // };

      // return temp as AcuerdoEnergia;
      return data as AcuerdoEnergia;
    }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }
}
