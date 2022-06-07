import { NgxSpinnerService } from 'ngx-spinner';
import { Web3Service } from './../../services/web3.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private web3Service: Web3Service,
    private spinnerService: NgxSpinnerService,
    private router: Router) { }

  ngOnInit(): void {
  }

  onLogin() {

    this.web3Service.connectAccount().subscribe({
      next: (account) => {
        localStorage.setItem('account', account[account.length - 1]);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

}
