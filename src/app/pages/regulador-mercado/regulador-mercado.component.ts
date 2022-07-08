import { Observable, timer, Subscription, interval } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { SolicitudContrato } from './../../models/solicitudContrato';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { ToastrService } from 'ngx-toastr';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-regulador-mercado',
  templateUrl: './regulador-mercado.component.html',
  styles: [
  ]
})
export class ReguladorMercadoComponent implements OnInit, OnDestroy {
  solicitudesRegistro: SolicitudContrato[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;

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

  async ngOnInit() {
    this.spinner.show();
    await this.regulardorMercado.loadBlockChainContractData();
    this.spinner.hide();

    this.timerSubscription = this.timer$.subscribe(() => {
      this.regulardorMercado.getSolicitudesRegistro().subscribe({
        next: (data) => {
          this.contadorActual = data.length;
          if (this.contadorActual !== this.contadorAnterior) {
            this.solicitudesRegistro = data;
            this.toastr.success('Nueva solicitud de registro', 'Registro');
            this.contadorAnterior = this.contadorActual;
          }
        }, error: (err) => {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      });
    })
  }

}
