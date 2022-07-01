import { Observable, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ClienteFactoryService } from './../../services/cliente-factory.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { ComercializadorFactoryService } from 'src/app/services/comercializador-factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  constructor(private web3Service: Web3ConnectService,
    private clienteFactory: ClienteFactoryService,
    private comercializadorFactory: ComercializadorFactoryService,
    private generadorFactory: GeneradorFactoryService,
    private spinnerService: NgxSpinnerService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  async onLogin() {
    try {
      this.spinnerService.show();
      await this.web3Service.loadWeb3();
      this.spinnerService.hide();
      this.router.navigate(['/dashboard']);
      // let promises: Promise<void>[] = [];
      // promises.push(this.clienteFactory.loadBlockChainContractData());
      // promises.push(this.comercializadorFactory.loadBlockChainContractData());
      // promises.push(this.generadorFactory.loadBlockChainContractData());
      // await Promise.all(promises);
      // debugger
      // let comprobacionCuenta: Observable<any>[] = [];
      // comprobacionCuenta.push(this.clienteFactory.getIsDireccionRegistrada());
      // comprobacionCuenta.push(this.comercializadorFactory.getIsDireccionRegistrada());
      // comprobacionCuenta.push(this.generadorFactory.getIsDireccionRegistrada());

      // forkJoin(comprobacionCuenta).subscribe({
      //   next: (result) => {
      //     debugger
      //     console.log(result);
      //     this.spinnerService.hide();
      //     this.router.navigate(['/dashboard']);
      //   },
      //   error: (error) => {
      //     debugger
      //     this.spinnerService.hide();
      //     console.log(error);
      //     this.toastr.error(error.message, 'Error');
      //   }
      // });
    } catch (error) {

      this.spinnerService.hide();
      this.toastr.error(error.message, 'Error');
    }

  }

}

