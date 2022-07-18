import { NgxSpinnerService } from 'ngx-spinner';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ToastrService } from 'ngx-toastr';
import { InfoEnergia } from './../../models/InfoEnergia';
import { Component, OnInit } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-banco-energia',
  templateUrl: './banco-energia.component.html',
  styles: [
  ]
})
export class BancoEnergiaComponent implements OnInit {
  energiasDisponibles: InfoEnergia[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  isFromInit: boolean = false;
  contadorAnterior: number = 0;
  contadorActual: number = 0;

  estadoAnterior: InfoEnergia[] = [];
  estadoActual: InfoEnergia[] = [];

  constructor(private toastr: ToastrService,
    private bancoEnergia: BancoEnergiaService,
    private spinner: NgxSpinnerService) {
    this.timer$ = timer(0, 1000);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.isFromInit = true;
      this.spinner.show();
      await this.bancoEnergia.loadBlockChainContractData();
      this.spinner.hide();

      this.timerSubscription = this.timer$.subscribe(() => {
        if (this.energiasDisponibles) {
          this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
            next: (data) => {
              this.contadorActual = data.length;
              if (this.contadorActual !== this.contadorAnterior) {
                this.energiasDisponibles = data;
                this.estadoActual = data;
                this.estadoAnterior = this.estadoActual;
                this.contadorAnterior = this.contadorActual;
              } else {
                for (let i = 0; i < data.length; i++) {
                  let flag: boolean = false;
                  if (this.estadoActual[i].nombre !== data[i].nombre) {
                    flag = true;
                  }else if (this.estadoActual[i].cantidadEnergia !== data[i].cantidadEnergia) {
                    flag = true;
                  }else if(this.estadoActual[i].precio !== data[i].precio){
                    flag = true;
                  }
                  if (flag) {
                    this.energiasDisponibles = data;
                    this.estadoAnterior = this.estadoActual;
                  }
                }
              }
            },
            error: (err) => {
              console.log(err);
              this.toastr.error(err.message, 'Error');
            }
          });
        }
      })
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

}
