import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { ToastrService } from 'ngx-toastr';
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';

@Component({
  selector: 'app-liquidar-inyeccion',
  templateUrl: './liquidar-inyeccion.component.html',
  styles: [
  ]
})
export class LiquidarInyeccionComponent implements OnInit {

  liquidarEnergiaForm: FormGroup;
  fechaLiquidacion: string = '';
  fechaLiquidacionMiliseconds: string = '';
  constructor(public dialogRef: MatDialogRef<LiquidarInyeccionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private bancoEnergia: BancoEnergiaService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    await this.bancoEnergia.loadBlockChainContractData();
    this.spinner.hide();
  }

  initForm() {
    this.liquidarEnergiaForm = this.fb.group({
      fechaLiquidacion: [this.fechaLiquidacion, Validators.required]
    });

    this.liquidarEnergiaForm.get('fechaLiquidacion').valueChanges.subscribe({
      next: data => {
        this.fechaLiquidacion = data !== '' ? moment(data).format('DD/MM/YYYY') : 'Invalid date';
        this.fechaLiquidacionMiliseconds = data !== '' ? moment(data).format('x') : 'Invalid date';
      }
    })
  }

  onLiquidarInyecciones() {
    this.alertDialog.confirmAlert('Liquidacion de inyecciones', `Desea liquidar todas las inyecciones realizadas en la fecha ${this.fechaLiquidacion}`).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        const timeStamp = parseInt(this.fechaLiquidacionMiliseconds) / 1000;
        this.bancoEnergia.liquidarInyecciones(timeStamp).subscribe({
          next: () => {
            this.dialogRef.close();
            this.spinner.hide();
          },
          error: error => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
            this.spinner.hide();
            this.dialogRef.close();
          }
        })
      }
    })


  }

  onCancelar() {
    this.dialogRef.close();
  }
}
