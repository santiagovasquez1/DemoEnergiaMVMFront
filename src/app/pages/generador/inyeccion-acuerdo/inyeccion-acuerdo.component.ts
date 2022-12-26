import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcuerdoEnergia } from 'src/app/models/AcuerdoEnergia';
import { LiquidarContratoComponent } from '../../regulador-mercado/liquidar-contrato/liquidar-contrato.component';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-inyeccion-acuerdo',
  templateUrl: './inyeccion-acuerdo.component.html',
  styles: [
  ]
})
export class InyeccionAcuerdoComponent implements OnInit {

  dirGenerador: string = '';
  cantidadEnergiaBolsa: number = 0;
  energiaAInyectar: number = 0;

  constructor(public dialogRef: MatDialogRef<LiquidarContratoComponent>,
    private generadorService: GeneradorContractService,
    @Inject(MAT_DIALOG_DATA) public data: AcuerdoEnergia,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService) {
    this.dirGenerador = localStorage.getItem('dirContract');
  }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.generadorService.loadBlockChainContractData(this.dirGenerador));
      await Promise.all(promises);
      this.spinner.hide();
      this.getEnergiaEnBolsa();
    } catch (error) {
      console.log(error);
      this.toastr.error(error, 'Error');
      this.spinner.hide();
      this.dialogRef.close();
    }
  }

  private getEnergiaEnBolsa() {
    this.spinner.show();
    this.generadorService.getEnergiaBolsaGenerador().subscribe({
      next: data => {
        this.cantidadEnergiaBolsa = data.filter(item => item.nombre === this.data.tipoEnergia)[0].cantidadEnergia;
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.toastr.error(error, 'Error');
        this.spinner.hide();
        this.dialogRef.close();
      }
    })
  }

  get inyectarIsValid(): boolean {
    return this.energiaAInyectar <= this.cantidadEnergiaBolsa
      && this.energiaAInyectar > 0
      && this.energiaAInyectar + this.data.cantidadEnergiaInyectada <= this.data.cantidadEnergiaTotal
      && this.energiaAInyectar !== null ? true : false;
  }

  onInyectarEnergia() {
    this.alertDialog.confirmAlert('Inyección energia contrato', `¿Deseas inyectar ${this.energiaAInyectar} Mw al contrato?`).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.generadorService.inyectarEnergiaContratos(this.data.dataCliente.dirContrato, this.data.tipoEnergia, this.energiaAInyectar, this.data.indexGlobal).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success('Energía inyectada con exito', 'Exito');
            this.dialogRef.close();
          },
          error: error => {
            console.log(error);
            this.toastr.error(error, 'Error');
            this.spinner.hide();
            this.dialogRef.close();
          }
        })
      }
    });
  }
}
