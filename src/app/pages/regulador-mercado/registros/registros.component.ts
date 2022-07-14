import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';

@Component({
  selector: 'app-registros',
  templateUrl: './registros.component.html',
  styles: [
  ]
})
export class RegistrosComponent implements OnInit, OnDestroy {

  registrosContratos: SolicitudContrato[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;

  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private spinner: NgxSpinnerService) {
    this.timer$ = timer(0, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      this.isFromInit = true;
      this.spinner.show();
      await this.regulardorMercado.loadBlockChainContractData();
      this.spinner.hide();
      this.timerSubscription = this.timer$.subscribe(() => {
        this.regulardorMercado.getContratosRegistrados().subscribe({
          next: (data) => {
            this.contadorActual = data.length;
            if (this.contadorActual !== this.contadorAnterior) {
              this.registrosContratos = data;
              if (this.contadorActual > this.contadorAnterior && !this.isFromInit) {
                this.toastr.success('Nuevo contrato registrado', 'Registro');
              }
              this.contadorAnterior = this.contadorActual;
            }
          }, error: (err) => {
            console.log(err);
            this.toastr.error(err.message, 'Error');
          }
        });
      });      
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

}
