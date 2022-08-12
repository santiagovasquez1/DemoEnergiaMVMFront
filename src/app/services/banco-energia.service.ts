import { InfoEnergia } from './../models/InfoEnergia';
import { Observable, catchError, throwError, from, map } from 'rxjs';
import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { Web3ConnectService } from './web3-connect.service';
import { WinRefService } from './win-ref.service';
import bancoEnergia from '../../../buildTruffle/contracts/BancoEnergia.json';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

@Injectable({
  providedIn: 'root'
})
export class BancoEnergiaService {
  contract: Contract | undefined;
  account: any;
  adressContract: any;
  web3: Web3;
  constructor(private winRef: WinRefService, private web3ConnectService: Web3ConnectService) { }

  async loadBlockChainContractData() {
    await this.web3ConnectService.loadWeb3();
    this.web3 = this.winRef.window.web3 as Web3;

    const networkId = await this.web3.eth.net.getId();
    const networkData = bancoEnergia.networks[networkId];
    if (networkData) {
      const abi = bancoEnergia.abi;
      this.adressContract = networkData.address;
      this.contract = new this.web3.eth.Contract(abi as unknown as AbiItem, this.adressContract);
      this.account = localStorage.getItem('account');
      localStorage.setItem('addressRegulador', this.adressContract);
    } else {
      window.alert('Esta aplicación no está disponible en este network.');
    }
  }

  getTiposEnergiasDisponibles(): Observable<InfoEnergia[]> {
    return from(this.contract.methods.getTiposEnergiasDisponibles().call({ from: this.account })).pipe(
      map((data: any) => {
        let tempArray = data.map((infoEnergia) => {
          const [nombre, cantidadEnergia, precio] = infoEnergia;
          const tempEnergia: InfoEnergia = {
            nombre,
            cantidadEnergia,
            precio
          }
          return tempEnergia;
        })
        return tempArray as InfoEnergia[];
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }


}
