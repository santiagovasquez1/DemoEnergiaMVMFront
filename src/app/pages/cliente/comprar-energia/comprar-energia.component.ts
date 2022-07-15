import { InfoEnergia } from './../../../models/InfoEnergia';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';

@Component({
  selector: 'app-comprar-energia',
  templateUrl: './comprar-energia.component.html',
  styles: [
  ]
})
export class ComprarEnergiaComponent implements OnInit {

  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];

  constructor(public dialogRef: MatDialogRef<ComprarEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private bancoEnergia: BancoEnergiaService) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.clienteService.loadBlockChainContractData(this.data.dirContrato));
      await Promise.all(promises);

      this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
        next: (data) => {
          console.log(data);
          this.tiposEnergia = data;
        },
        error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      });
      this.comprarEnergiaForm.get('tipoEnergia').valueChanges.subscribe({
        next: () => {
          this.onEnergiaChange();
        }
      });
      this.comprarEnergiaForm.get('cantidadEnergia').valueChanges.subscribe({
        next: () => {
          this.onEnergiaChange();
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
    }
  }

  private onEnergiaChange() {
    let tipoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value ==''? null: this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
    let cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value == '' ? 0 : this.comprarEnergiaForm.get('cantidadEnergia').value;
    if (cantidadEnergia > 0 && tipoEnergia) {
      let precioEnergia = tipoEnergia.precio * cantidadEnergia;
      this.comprarEnergiaForm.get('valorCompra').setValue(precioEnergia);
    }
  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      tipoEnergia: ['', Validators.required],
      cantidadEnergia: ['', Validators.required],
      valorCompra: [{ value: '', disabled: true }, Validators.required],
    });
  }

  onComprarEnergia() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea comprar energía?').then((result) => {

    });
  }

}
