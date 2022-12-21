import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-consumir-energia',
  templateUrl: './consumir-energia.component.html',
  styles: [
  ]
})
export class ConsumirEnergiaComponent implements OnInit {

  energiaDisponible:number
  cantidadEnergia: number;
  consumoForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<ConsumirEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: FormBuilder) {
    this.energiaDisponible = this.data.cantidadesDisponibles;
    this.consumoForm = this.fb.group({});
  }

  async ngOnInit(): Promise<void> {
    this.initForm();
    await this.clienteService.loadBlockChainContractData(this.data.dirContrato);
  }

  initForm() {
    this.consumoForm = this.fb.group({
      cantidadDisponible: [{ value: this.energiaDisponible, disabled: true }],
      cantidad: ['', Validators.required]
    })

    this.consumoForm.get('cantidad').valueChanges.subscribe(data => {
      this.cantidadEnergia = data !== '' ? parseInt(data) : 0;
    });
  }

  onConsumirEnergia() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea consumir energía?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.clienteService.postConsumirEnergia(this.cantidadEnergia).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success(`Consumo de ${this.cantidadEnergia}MWh`, 'Éxito');
              this.dialogRef.close();
            },
            error: (error) => {
              this.spinner.hide();
              this.toastr.error(error.message, 'Error');
              this.dialogRef.close();
            }
          })
        }
      });
  }

  get isValid(): boolean {
    if (this.cantidadEnergia <= this.energiaDisponible && this.cantidadEnergia > 0 && this.consumoForm.valid) {
      return true;
    } else {
      return false;
    }
  }
}
