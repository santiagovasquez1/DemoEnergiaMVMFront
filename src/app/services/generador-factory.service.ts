import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { Injectable } from '@angular/core';
import { WinRefService } from './win-ref.service';
import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import generadorFactory from "../../../build/contracts/MvmGeneradorFactory.json";
import { AbiItem } from 'web3-utils';
import { catchError, forkJoin, from, switchMap, throwError } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeneradorFactoryService {

  contract: Contract | undefined;
  account: any;

  constructor(private winRef: WinRefService, private web3Connect: Web3ConnectService) { }

  async loadBlockChainContractData() {
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    const networkId = await web3.eth.net.getId();
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

  agregarGenerador(nombreGenerador): Observable<any> {
    let account = localStorage.getItem('account');
    if (account) {
      console.log(this.contract);
      return from(this.contract.methods.factoryGenerador(nombreGenerador).send({ from: account })).pipe(
        catchError((error) => {
          return throwError(() => new Error(error.message));
        })
      );
    }
    else {
      return throwError(() => new Error("No hay una cuenta seleccionada"));
    }
  }

  verGeneradores(): Observable<any> {
    return from(this.contract?.methods.getContratosOwners().call()).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }
}
