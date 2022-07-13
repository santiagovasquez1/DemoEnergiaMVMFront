import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-comprar-energia',
  templateUrl: './comprar-energia.component.html',
  styles: [
  ]
})
export class ComprarEnergiaComponent implements OnInit {

  comprarEnergiaForm: FormGroup
  tiposEnergia = ['solar', 'eolica'];

  constructor(public dialogRef: MatDialogRef<ComprarEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: FormBuilder) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.clienteService.loadBlockChainContractData(this.data.dirContrato);
      this.comprarEnergiaForm.get('tipoEnergia').valueChanges.subscribe();
      this.comprarEnergiaForm.get('cantidad').valueChanges.subscribe();
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
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
