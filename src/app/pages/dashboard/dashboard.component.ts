import { Web3Service } from './../../services/web3.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private web3Service: Web3Service) { }

  ngOnInit(): void {
    this.web3Service.initContract();
  }

}
