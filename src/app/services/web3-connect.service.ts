import { Injectable } from '@angular/core';
import { WinRefService } from './win-ref.service';
import Web3 from 'web3';

@Injectable({
  providedIn: 'root',
})
export class Web3ConnectService {
  public web3!: Web3;
  account: any;
  constructor(private readonly winRef: WinRefService) {}

  public async loadWeb3(): Promise<void> {
    if (this.winRef.window.ethereum) {
      // Si quieres seguir usando MetaMask para enviar tx, puedes combinar:
      this.web3 = new Web3(this.winRef.window.ethereum);
      try {
        await this.winRef.window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
        localStorage.setItem('account', this.account);
      } catch (error) {
        console.error(error);
      }
    } else {
      // **FALLBACK** directo a WebSocket en tu nodo local
      const wsProvider = new Web3.providers.WebsocketProvider(
        'ws://mvmchain-nodes-balancer.eastus.cloudapp.azure.com:6174' // tu rpc-ws-port
      );
      this.web3 = new Web3(wsProvider);
      console.log('Conectado por WS a ws://localhost:6174');
      // si quieres leer cuentas locales (por ejemplo en un nodo con unlocked accounts):
      const accounts = await this.web3.eth.getAccounts();
      this.account = accounts[0] || '';
      if (this.account) localStorage.setItem('account', this.account);
    }
    // siempre inyectamos la instancia en window para que tus servicios la encuentren:
    this.winRef.window.web3 = this.web3;
  }
}
