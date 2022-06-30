import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import reguladorMercado from "../../../build/contracts/ReguladorMercado.json";
import { WinRefService } from './win-ref.service';

@Injectable({
  providedIn: 'root'
})
export class ReguladorMercadoService {

  contract: Contract | undefined;
  account: any;
  adressContract: any;

  constructor(private winRef: WinRefService) { }

  async loadBlockChainContractData() {
    const web3 = this.winRef.window.web3 as Web3;
    const networkId = await web3.eth.net.getId();
    console.log(networkId);
    const networkData = reguladorMercado.networks[networkId];
    console.log("networkdata regulador: ",networkData);
    if (networkData) {
      const abi = reguladorMercado.abi;
      this.adressContract = networkData.address;
      this.contract = new web3.eth.Contract(abi as unknown as AbiItem, this.adressContract);
      localStorage.setItem('addressRegulador',this.adressContract);
    } else {
      window.alert('Esta aplicación no está disponible en este network.');
    }
  }
}
