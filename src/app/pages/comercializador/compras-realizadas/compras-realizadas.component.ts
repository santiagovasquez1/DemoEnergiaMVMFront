import { InfoCompraEnergia } from './../../../models/InfoCompraEnergia';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';

@Component({
  selector: 'app-compras-realizadas',
  templateUrl: './compras-realizadas.component.html',
  styles: [
  ]
})
export class ComprasRealizadasComponent implements OnInit, OnDestroy {
  title: string = "Compras realizadas";
  comprasRealizadas: InfoCompraEnergia[] = [];

  constructor(private comercializadorService: ComercializadorContractService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,) {

  }

  async ngOnInit(): Promise<void> {
    try {
      const dirContract = localStorage.getItem('dirContract');
      await this.comercializadorService.loadBlockChainContractData(dirContract);
      this.loadComprasRealizadas();
      this.comercializadorService.contract?.events.EmisionCompraExitosa({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        } else {
          this.loadComprasRealizadas();
          this.toastr.success('Compra realizada', 'Éxito');
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngOnDestroy(): void {
    
  }

  loadComprasRealizadas() {
    this.spinner.show();
    this.comercializadorService.getInfoComprasRealizadas().subscribe({
      next: (comprasRealizadas) => {
        this.comprasRealizadas = comprasRealizadas;
        this.spinner.hide();
      }, error: (err) => {
        this.spinner.hide();
        this.toastr.error(err.message, 'Error');
      }
    });
  }

}
