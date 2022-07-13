import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-devolver-tokens',
  templateUrl: './devolver-tokens.component.html',
  styles: [
  ]
})
export class DevolverTokensComponent implements OnInit {
  devolucionTokensForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<DevolverTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService
  ) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.devolucionTokensForm.get('tokensDisponibles').setValue(this.data.tokensDisponibles);
      await this.reguladorMercado.loadBlockChainContractData();
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  initForm() {
    this.devolucionTokensForm = this.fb.group({
      tokensDisponibles: [{ value: '', disabled: true }],
      cantidadTokensDevolver: ['', Validators.required]
    });
  }

  onDevolverTokens() {
    this.alertDialog.confirmAlert('Confirmar devolución', '¿Está seguro de que desea devolver los tokens?').then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.reguladorMercado.postDevolverTokens(this.devolucionTokensForm.get('cantidadTokensDevolver').value).subscribe({
          next: () => {
            this.spinner.hide();
            this.dialogRef.close();
            this.toastr.success('Tokens devueltos correctamente', 'Éxito');
          },
          error: (error) => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
            this.spinner.hide();
            this.dialogRef.close();
          }
        });
      }
    });
  }

  get isValid(): boolean {
    if (this.devolucionTokensForm.get('cantidadTokensDevolver').value > this.data.tokensDisponibles && this.devolucionTokensForm.get('cantidadTokensDevolver').value > 0 && this.devolucionTokensForm.valid) {
      return true;
    } else {
      return false;
    }
  }
}
