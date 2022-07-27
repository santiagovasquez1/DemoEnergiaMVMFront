import { CompraEnergiaComponent } from './../compra-energia/compra-energia.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { EstadoCompra, InfoEmisionCompra } from './../../../models/InfoEmisionCompra';
import { Component, OnInit } from '@angular/core';
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
export class EmisionesCompraComponent implements OnInit {

  emisionesDeCompra: InfoEmisionCompra[] = [];
  isLoading: boolean = false;

  constructor(private comercializadorService: ComercializadorContractService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService) { }

  async ngOnInit(): Promise<void> {
    let dirContract = localStorage.getItem('dirContract');
    try {
      await this.comercializadorService.loadBlockChainContractData(dirContract);
      this.comercializadorService.contract.events.EmisionDeCompra({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        } else {
          this.getEmisionesDeCompra();
        }
      });
      this.getEmisionesDeCompra();
    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar el contrato comercializador", 'Error');
    }
  }


  private getEmisionesDeCompra() {

    this.comercializadorService.getEmisionesDeCompra().subscribe({
      next: (emisiones) => {
        debugger;
        this.emisionesDeCompra = emisiones.filter(emision => emision.estado == EstadoCompra.pendiente);
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
