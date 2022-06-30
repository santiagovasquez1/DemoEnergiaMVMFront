import { Web3Service } from './../../services/web3.service';
import { Component, OnInit } from '@angular/core';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private web3Service: Web3ConnectService,
              private reguladorService: ReguladorMercadoService) { }

  async ngOnInit() {
    //this.web3Service.initContract();
    try{
      await this.web3Service.loadWeb3();
      await this.reguladorService.loadBlockChainContractData();
      console.log("Cargado regulador dashboard!");
    }
    catch{
      console.log("Error regulador dashboard!");
    }
    
    
  }

}
