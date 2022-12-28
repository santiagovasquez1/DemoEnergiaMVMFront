import { switchMap } from 'rxjs';
import { ClienteContractService } from './../../../services/cliente-contract.service';
import { ReguladorMercadoService } from './../../../services/regulador-mercado.service';
import { AcuerdoEnergia, EstadoAcuerdo } from './../../../models/AcuerdoEnergia';
import { AcuerdoContractService } from 'src/app/services/acuerdo-contract.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import moment from 'moment';

@Component({
  selector: 'app-liquidar-contrato',
  templateUrl: './liquidar-contrato.component.html',
  styles: [
  ]
})
export class LiquidarContratoComponent implements OnInit {

  tokensCliente: number = 0;

  constructor(public dialogRef: MatDialogRef<LiquidarContratoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AcuerdoEnergia,
    private acuerdoLedger: AcuerdoContractService,
    private reguladorMercado: ReguladorMercadoService,
    private clienteService: ClienteContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService) { }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    let promises: Promise<void>[] = [];
    promises.push(this.acuerdoLedger.loadBlockChainContractData());
    promises.push(this.reguladorMercado.loadBlockChainContractData());
    promises.push(this.clienteService.loadBlockChainContractData(this.data.dataCliente.dirContrato));
    await Promise.all(promises);
    this.getTokensCliente();
    this.spinner.hide();
  }

  private getTokensCliente() {
    this.spinner.show();
    this.clienteService.getInfoContrato().pipe(
      switchMap(data => {
        return this.reguladorMercado.getTokensAgente(data.owner);
      })
    ).subscribe({
      next: data => {
        this.tokensCliente = data;
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.spinner.hide();
        this.toastr.error(error.message, 'Error');
        this.dialogRef.close();
      }
    });
  }

  onLiquidarContrato() {
    this.alertDialog.confirmAlert('Liquidación contrato', '¿Deseas liquidar el contrato?').then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.acuerdoLedger.liquidacionContrato(this.data.indexGlobal).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success('Liquidación de contrato', 'Exito');
            this.dialogRef.close();
          },
          error: error => {
            console.log(error);
            this.spinner.hide();
            this.toastr.error(error.message, 'Error');
            this.dialogRef.close();
          }
        })
      }
    })
  }

  get liquidacionValid(): boolean {
    const timeNow = moment(Date.now());
    const fechaFin = moment(this.data.fechaFin, 'DD/MM/YYYY').hour(23).minute(59).second(59);
    if (timeNow.isSameOrAfter(fechaFin) && this.data.cantidadEnergiaTotal === this.data.cantidadEnergiaInyectada && this.tokensCliente >= this.data.valorContrato && this.data.estadoAcuerdo === EstadoAcuerdo.activo) {
      return true;
    }
    return false;
  }
}
