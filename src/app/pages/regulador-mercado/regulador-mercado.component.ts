import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer } from 'rxjs';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { InfoReguladorMercado } from './../../models/infoReguladorMercado';

@Component({
  selector: 'app-regulador-mercado',
  templateUrl: './regulador-mercado.component.html',
  styles: [
  ]
})
export class ReguladorMercadoComponent implements OnInit, OnDestroy {
  infoRegulador: InfoReguladorMercado;
  timer$: Observable<any>;
  timerSubscription: Subscription;

  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService) {
    this.timer$ = timer(0, 1000);
  }

  ngOnDestroy(): void {
    if(this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    try {
      await this.regulardorMercado.loadBlockChainContractData();
      this.timerSubscription = this.timer$.subscribe(() => {
        if(this.infoRegulador){
          this.regulardorMercado.getTokensDisponibles().subscribe({
            next: (data) => {
              this.infoRegulador.cantidadTokens = data;
            },
            error: (err) => {
              console.log(err);
            }
          });
        }
      })
      this.regulardorMercado.getInfoRegulador().subscribe({
        next: (data) => {
          this.infoRegulador = data;
        },
        error: (err) => {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      });
      
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }


}
