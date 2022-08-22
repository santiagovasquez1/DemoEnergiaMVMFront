import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ComercializadorContractService } from './../../../services/comercializador-contract.service';
import { InfoContrato } from './../../../models/infoContrato';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Observable, Subscription, timer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.component.html',
  styles: [
  ]
})
export class ListaClientesComponent implements OnInit, OnDestroy {

  clientesComercializador: InfoContrato[] = [];
  tokensDelegados: number[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;

  constructor(private toastr: ToastrService,
    private comercializador: ComercializadorContractService,
    private reguladorMercado: ReguladorMercadoService,
    private spinner: NgxSpinnerService) {
    this.timer$ = timer(0, 1000);
  }
  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    try {
      this.isFromInit = true;
      const dirContrato = localStorage.getItem('dirContract');
      await this.reguladorMercado.loadBlockChainContractData();
      await this.comercializador.loadBlockChainContractData(dirContrato);
      this.timer$.subscribe({
        next: () => {
          this.comercializador.getClientesComercializador().subscribe({
            next: (data) => {
              this.contadorActual = data.length;
              if (this.contadorActual !== this.contadorAnterior) {
                this.clientesComercializador = data;
                let delegacionesObs: Observable<number>[] = [];
                this.clientesComercializador.forEach(cliente => {
                   
                  delegacionesObs.push(this.reguladorMercado.getTokensDelegados(this.comercializador.dirContrato, cliente.owner));
                });
                forkJoin(delegacionesObs).subscribe({
                  next: (data) => {
                     
                    this.tokensDelegados = data;
                  },error: (err) => {
                    console.log(err);
                    this.toastr.error(err.message, 'Error');
                  }
                });
                if (this.contadorActual > this.contadorAnterior && !this.isFromInit) {
                  this.toastr.success('Nuevo cliente suscrito', 'Registro');
                }
                this.contadorAnterior = this.contadorActual;
              }
            }
          })
        }
      })
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

}
