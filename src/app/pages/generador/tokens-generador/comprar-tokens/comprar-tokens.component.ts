import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';

@Component({
  selector: 'app-comprar-tokens',
  templateUrl: './comprar-tokens.component.html'
})
export class ComprarTokensComponent implements OnInit {

  cantidadTokens: number;
  compraTokensForm: FormGroup

  constructor(public dialogRef: MatDialogRef<ComprarTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: FormBuilder) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.spinner.show();
      let promises: Promise<void>[] = [];
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      await Promise.all(promises);
      this.spinner.hide();
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
      this.dialogRef.close();
    }
  }

  private onTokensChange(data: string) {
    this.cantidadTokens = data == '' ? 0 : parseInt(data);
    let precioEnergia = 0;
    if (this.cantidadTokens > 0) {
      precioEnergia = 0.001 * 1500 * 4500 * this.cantidadTokens;
    }
    this.compraTokensForm.get('valorCompra').setValue(precioEnergia);
  }

  initForm() {
    this.compraTokensForm = this.fb.group({
      cantidadTokens: ['', Validators.required],
      valorCompra: [{ value: 0, disabled: true }, Validators.required]
    });

    this.compraTokensForm.get('cantidadTokens').valueChanges.subscribe(data => this.onTokensChange(data))
  }

  onComprarTokens() {
    this.alertDialog.confirmAlert('Confirmar', `¿Está seguro de que desea comprar ${this.cantidadTokens} Tokens?`)
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.reguladorMercado.postComprarTokens(this.cantidadTokens).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success('Compra de tokens realizada', 'Exito');
              this.dialogRef.close();
            },
            error:error=>{
              console.log(error);
              this.toastr.error('Error al cargar los datos', error.message);
              this.dialogRef.close();
            }
          })
        }
      });
  }

  onCancelar() {
    this.dialogRef.close();
  }
}
