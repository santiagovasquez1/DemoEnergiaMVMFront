import { Injectable } from '@angular/core';
import { WinRefService } from './win-ref.service';
import { ToastrService } from 'ngx-toastr';
import { InfoContrato } from '../models/infoContrato';
import { Contract } from 'web3-eth-contract';
import { Web3ConnectService } from './web3-connect.service';
import { AbiItem } from 'web3-utils';
import BonoCarbono from '../../../buildTruffle/contracts/BonoCarbono.json';
import Web3 from 'web3';
import { catchError, from, map, Observable, throwError } from 'rxjs';
import { BonoCarbonoInfo } from '../models/BonoCarbonoInfo';

@Injectable({
  providedIn: 'root',
})
export class BonosCarbonoService {
  infoContrato: InfoContrato;
  dirContrato: string;
  contract: Contract | undefined;
  account: any;

  constructor(
    public winRef: WinRefService,
    public web3Connect: Web3ConnectService,
    public toastr: ToastrService
  ) {}

  public setContractData(contractJson: any, web3: Web3) {
    try {
      const abi = contractJson.abi;
      this.account = localStorage.getItem('account');
      this.contract = new web3.eth.Contract(
        abi as unknown as AbiItem,
        this.dirContrato
      );
    } catch (error) {
      this.toastr.error(error.message, 'Error');
    }
  }

  async loadBlockChainContractData(dirContrato: string): Promise<void> {
    this.dirContrato = dirContrato;
    await this.web3Connect.loadWeb3();
    const web3 = this.winRef.window.web3 as Web3;
    this.setContractData(BonoCarbono, web3);
  }

  private mapBonos(data: any[]): BonoCarbonoInfo[] {
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
    return data.map(
      (bono: any): BonoCarbonoInfo => ({
        id: parseInt(bono[0]),
        owner: bono[1] === NULL_ADDRESS ? '' : bono[1],
        generador: bono[2] === NULL_ADDRESS ? '' : bono[2],
        nombreGenerador: bono[3],
        timestampGenerado: parseInt(bono[4]),
        toneladasCO2: parseInt(bono[5]),
        fuenteEnergia: bono[6],
        vendido: bono[7],
        comprador: bono[8] === NULL_ADDRESS ? '' : bono[8],
        nombreComprador: bono[9],
        timestampVenta: parseInt(bono[10]),
      })
    );
  }

  getBonoDetails(bonoId: number): Observable<BonoCarbonoInfo> {
    return from(
      this.contract?.methods.getBono(bonoId).call({ from: this.account })
    ).pipe(
      map((data: any) => {
        const bono = this.mapBonos([data]);
        return bono[0];
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getBonosByOwner(dirOwner: string): Observable<BonoCarbonoInfo[]> {
    return from(
      this.contract?.methods
        .getBonosByOwner(dirOwner)
        .call({ from: this.account })
    ).pipe(
      map((data: any) => {
        return this.mapBonos(data);
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getOwnerBono(bonoId: number): Observable<BonoCarbonoInfo> {
    return from(
      this.contract?.methods.ownerOf(bonoId).call({ from: this.account })
    ).pipe(
      map((data: any) => {
        const bono = this.mapBonos([data]);
        return bono[0];
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  getAllBonos(): Observable<BonoCarbonoInfo[]> {
    return from(
      this.contract?.methods.getOtherBonos().call({ from: this.account })
    ).pipe(
      map((data: any) => this.mapBonos(data)),
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }

  comprarBono(bonoId: number, compradorName: string): Observable<any> {
    return from(
      this.contract?.methods
        .comprarBono(bonoId, compradorName)
        .send({ from: this.account })
    ).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.message));
      })
    );
  }
}
