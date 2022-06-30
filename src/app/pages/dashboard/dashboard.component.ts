import { Web3Service } from './../../services/web3.service';
import { Component, OnInit } from '@angular/core';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private web3Service: Web3Service,
              private reguladorService: ReguladorMercadoService) { }

  async ngOnInit() {
    //this.web3Service.initContract();
    try{
      await this.reguladorService.loadBlockChainContractData();
      console.log("Cargado regulador!");
    }
    catch{
      console.log("Error!");
    }
    
    
  }

}
