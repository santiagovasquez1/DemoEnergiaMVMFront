import { InfoContrato } from './../models/infoContrato';
import { catchError, from, map, Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Web3ConnectService } from './web3-connect.service';
import { WinRefService } from './win-ref.service';
import { Contract } from 'web3-eth-contract';

@Injectable({
  providedIn: 'root'
})
export abstract class AgenteContractService {

  infoContrato: InfoContrato;
  dirContrato: string;
  contract: Contract | undefined;
  account: any;

  constructor(public winRef: WinRefService, public web3Connect: Web3ConnectService, public toastr: ToastrService) { }

  abstract loadBlockChainContractData(dirContrato: string): Promise<void>;

  public setContractData(factoryJson: any, web3: Web3) {
    try {
      const abi = factoryJson.abi;
      this.account = localStorage.getItem('account');
      this.contract = new web3.eth.Contract(abi as unknown as AbiItem, this.dirContrato);
      console.log(this.contract);
    } catch (error) {
      this.toastr.error(error.message, 'Error');
    }

  }


  public getInfoContrato(): Observable<InfoContrato> {
    return from(this.contract?.methods.getInfoContrato().call({ from: this.account })).pipe(
      map((data: any) => {
        let tempInfo = {
          owner: data.owner,
          ciudad: data.ciudad,
          direccion: data.direccion,
          telefono: data.telefono,
          comercializador: data.comercializador,
          contacto: data.contacto,
          correo: data.correo,
          departamento: data.departamento,
          nit: data.nit,
          dirContrato: data.dirContrato,
          empresa: data.empresa,
          tipoComercio: data.tipoComercio
        };
        return tempInfo as InfoContrato;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }

  public getMisTokens(): Observable<number> {
    return from(this.contract?.methods.MisTokens().call({ from: this.account })).pipe(
      map((data: any) => {
        return data as number;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      }));
  }
}
