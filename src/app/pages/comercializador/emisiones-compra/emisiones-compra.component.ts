import { EnumTipoEmision } from './../../../models/EnumTipoEmision';
import { ActivatedRoute, Router } from '@angular/router';
import { CompraEnergiaComponent } from './../compra-energia/compra-energia.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { EstadoCompra, InfoEmisionCompra } from './../../../models/InfoEmisionCompra';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { filter, Observable, Subscription } from 'rxjs';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { CompraEnergiaRequest } from 'src/app/models/CompraEnergiaRequest';

@Component({
  selector: 'app-emisiones-compra',
  templateUrl: './emisiones-compra.component.html',
  styles: [
  ]
})
export class EmisionesCompraComponent implements OnInit, OnDestroy {
  title: string;
  emisionesDeCompra: InfoEmisionCompra[] = [];
  isLoading: boolean = false;
  tipoEmision: EnumTipoEmision;
  emisionCompraEvent: any
  constructor(private comercializadorService: ComercializadorContractService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private route: Router) { }

  ngOnDestroy(): void {
    this.emisionCompraEvent.removeAllListeners('data');
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe({
      next: async (params) => {
        this.tipoEmision = params.tipo;
        switch (this.tipoEmision) {
          case EnumTipoEmision.aprobadas:
            this.title = 'Emisiones de compra aprobadas';
            break;
          case EnumTipoEmision.pendientes:
            this.title = 'Emisiones de compra pendientes';
            break;
          case EnumTipoEmision.rechazadas:
            this.title = 'Emisiones de compra rechazadas';
            break;
        }

        let dirContract = localStorage.getItem('dirContract');
        try {
          await this.comercializadorService.loadBlockChainContractData(dirContract);
          console.log('Contract loaded');
          this.emisionCompraEvent = this.comercializadorService.contract.events.EmisionDeCompra({
            fromBlock: 'latest'
          }, (err, event) => {
            if (err) {
              console.log(err);
              this.toastr.error(err.message, 'Error');
            } 
          }).on('data', (event) => {
            this.getEmisionesDeCompra();
            this.toastr.success('Emisión de compra registrada', 'Éxito');
          });
          this.getEmisionesDeCompra();
        } catch (error) {
          console.log(error);
          this.toastr.error("Error al cargar el contrato comercializador", 'Error');
        }
      },
      error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
        this.route.navigate(['/']);
      }
    });

  }


  private getEmisionesDeCompra() {

    this.comercializadorService.getEmisionesDeCompra().subscribe({
      next: (emisiones) => {
        switch (this.tipoEmision) {
          case EnumTipoEmision.aprobadas:
            this.emisionesDeCompra = emisiones.filter(emision => emision.estado == EstadoCompra.aprobada);
            break;
          case EnumTipoEmision.pendientes:
            this.emisionesDeCompra = emisiones.filter(emision => emision.estado == EstadoCompra.pendiente);
            break;
        }
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    });
  }

  public onRealizarCompra(emisionCompra: InfoEmisionCompra, index: number) {
    let dialog = this.dialog.open(CompraEnergiaComponent, {
      width: '800px',
      data: {
        emision: emisionCompra,
        index: index,
        dirContract: localStorage.getItem('dirContract')
      }
    });

    dialog.afterClosed().subscribe(result => {
      this.getEmisionesDeCompra();
    });
  }
}
