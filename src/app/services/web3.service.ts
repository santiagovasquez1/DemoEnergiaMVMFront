import { Injectable } from '@angular/core';
import Web3 from 'web3';
import Web3Modal from "web3modal";
import { provider } from 'web3-core';
import { EMPTY, from, Subject, switchMap } from 'rxjs';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { AbiItem } from 'web3-utils';
import { Observable } from 'rxjs';
import generador from '../../assets/contracts/generador.json';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  web3Modal: Web3Modal;
  web3js: Web3;
  provider?: provider;
  accounts: string[] = [];

  constructor() {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required | here whe import the package necessary to support wallets|| aqui importamos el paquete que nos ayudara a usar soportar distintas wallets
        options: {
          infuraId: 'env', // required change this with your own infura id | cambia esto con tu apikey de infura
          description: 'Scan the qr code and sign in', // You can change the desciption | Puedes camnbiar los textos descriptivos en la seccion description
          qrcodeModalOptions: {
            mobileLinks: [
              'rainbow',
              'metamask',
              'argent',
              'trust',
              'imtoken',
              'pillar'
            ]
          }
        }
      },
      injected: {
        display: {
          logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
          name: 'metamask',
          description: "Connect with the provider in your Browser"
        },
        package: null
      },

    };

    this.web3Modal = new Web3Modal({
      network: "ropsten", // optional
      cacheProvider: true, // optional
      providerOptions: providerOptions, // required
    });

    this.web3js = new Web3(null);
  }

  connectAccount() {
    return from(this.web3Modal.connect()).pipe(
      switchMap(data => {
        this.provider = data;
        if (this.provider) {
          this.web3js = new Web3(this.provider);
        }
        return from(this.web3js.eth.getAccounts());
      })
    );
  }

  logout(): Observable<any> {
    this.web3Modal.clearCachedProvider();
    // this.provider = null;
    this.web3js = new Web3(null);
    return EMPTY;
  }

  initContract() {
    let abiItems: AbiItem[] = generador.abi as unknown as AbiItem[];
    let contract = new this.web3js.eth.Contract(abiItems, '', {
      data: generador.data.bytecode.object
    });
    console.log(contract);
    contract.deploy({
      data: `0x${generador.data.bytecode.object}`,
    });
    console.log(contract);
  }
}
