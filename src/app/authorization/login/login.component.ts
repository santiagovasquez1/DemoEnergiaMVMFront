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
      let promises: Promise<void>[] = [];
      promises.push(this.clienteFactory.loadBlockChainContractData());
      promises.push(this.comercializadorFactory.loadBlockChainContractData());
      promises.push(this.generadorFactory.loadBlockChainContractData());
      await Promise.all(promises);
      
      let comprobacionCuenta: Observable<any>[] = [];
      comprobacionCuenta.push(this.clienteFactory.getIsDireccionRegistrada());
      comprobacionCuenta.push(this.comercializadorFactory.getIsDireccionRegistrada());
      comprobacionCuenta.push(this.generadorFactory.getIsDireccionRegistrada());

      forkJoin(comprobacionCuenta).subscribe({
        next: (result) => {          
          console.log(result);
          let existeCuenta = result.find((element) => element === true);
          this.spinnerService.hide();
          if(existeCuenta) {
            //TODO: Almacenar el tipo de cuenta en una variable de sesion
            this.router.navigate(['/dashboard']);
          }else{
            //TODO: Enviar a pagina de registro
            this.toastr.error('Esta cuenta no está registrada.', 'Error');
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.spinnerService.hide();
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      });
    } catch (error) {

      this.spinnerService.hide();
      this.toastr.error(error.message, 'Error');
    }

  }

}

