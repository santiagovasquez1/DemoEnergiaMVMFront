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
  escribirContract: any;

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
        this.connectWithEscribir();
        console.log("esta es su billetera: ",from(this.web3js.eth.getAccounts()))
        return from(this.web3js.eth.getAccounts());
      })
    );
  }

  async connectWithEscribir() {
    let contractInterface = {
      contractName: "EscribirEnLaBlockchain",
      abi: [{
        "inputs": [{ "internalType": "string", "name": "_texto", "type": "string" }], "name": "Escribir", "outputs": [], "stateMutability": "nonpayable", "type": "function"
      },
      { "inputs": [], "name": "Leer", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }],

    }

    let networks = {
      3: {
        address: "0x854ca9a9ef8830ebaee50cb721eA1D65dAa68D25",
        transactionHash: "0x019b85deba8261fc27cfd236cbcf409503e6c7e77576ebcf305b5e65e0dbb99c"
      }
    };

    const networkId = await this.web3js.eth.net.getId();
    console.log(networkId);
    const networkData = networks[3];
    let p = networkData && networkData.address;
    let contract = new this.web3js.eth.Contract(contractInterface.abi as unknown as AbiItem, p);
    this.escribirContract = contract;
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
    console.log("1",contract);
    /*
    contract.deploy({
      data: `0x${generador.data.bytecode.object}`,
    });
    console.log("2",contract);
    */
  }

  agregaraGenerador(planta: string, cantidad: number): Observable<any>{
    return from(this.escribirContract.methods.Escribir(planta).send({ from: '0x4eE3FA1d6b5B277277A15131260Ed67A2162bdF6' }));
  }
}
