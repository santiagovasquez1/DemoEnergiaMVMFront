import { Injectable } from '@angular/core';
import { WinRefService } from './win-ref.service';
import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import generadorFactory from "../../../build/contracts/MvmGeneradorFactory.json";
import { AbiItem } from 'web3-utils';
import { forkJoin, from, switchMap, throwError } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneradorFactoryService {

  contract: Contract | undefined;
  account: any;

  constructor(private winRef: WinRefService) { }

  async loadBlockChainContractData() {
    console.log("load generador");
    const web3 = this.winRef.window.web3 as Web3;
    //const accounts = await web3.eth.getAccounts();
    //console.log(accounts);
    //this.account = accounts[0];
    const networkId = await web3.eth.net.getId();
    console.log(networkId);
    const networkData = generadorFactory.networks[networkId];
    if (networkData) {
      const abi = generadorFactory.abi;
      const address = networkData.address;
      this.contract = new web3.eth.Contract(abi as unknown as AbiItem, address);
      console.log(this.contract);
    } else {
      window.alert('Esta aplicación no está disponible en este network.');
    }
  }

  agregarGenerador(nombreGenerador): Observable<any>{
    debugger
    let adressContract = localStorage.getItem('addressRegulador');
    let account = localStorage.getItem('account');
    console.log("adresscontract: ",adressContract);
    console.log("account: ",account);
    if(adressContract){
      console.log(this.contract);
      return from(this.contract.methods.factoryGenerador(adressContract,nombreGenerador).send({ from: account }));
    }
    else{
      return throwError(() => new Error('"No existe la dirección del regulador!"'));
    }
  }

  verGeneradores(): Observable<any>{
    return from(this.contract?.methods.getGeneradoresOwners().call());
  }
}
