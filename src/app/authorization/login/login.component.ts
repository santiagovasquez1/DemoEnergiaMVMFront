import { NgxSpinnerService } from 'ngx-spinner';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private web3Service: Web3ConnectService,
    private spinnerService: NgxSpinnerService,
    private router: Router
    ) { }

  ngOnInit(): void {
  }

  async onLogin() {
    this.spinnerService.show();
    await this.web3Service.loadWeb3();
    this.spinnerService.hide();
    this.router.navigate(['/dashboard']);
  }

}

