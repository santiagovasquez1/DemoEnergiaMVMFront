import { Injectable } from '@angular/core';
import { Contract } from 'web3-eth-contract';
import { WinRefService } from './win-ref.service';
import { Web3ConnectService } from './web3-connect.service';
import { ToastrService } from 'ngx-toastr';
import { AbiItem } from 'web3-utils';
import TokenErc20 from '../../../buildTruffle/contracts/ERC20Basic.json';
import Web3 from 'web3';
import { catchError, from, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TokenErc20Service {
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
    this.setContractData(TokenErc20, web3);
  }

  approve(address:string,amount:number):Observable<any>{
    debugger;
    return from(this.contract?.methods.approve(address,amount).send({ from: this.account })).pipe(
        catchError((error) => {
            debugger;
            this.toastr.error(error.message, 'Error');
            return throwError(() => new Error(error.message));
        })
    );
  }
}
