import { SweetAlertService } from './../../../services/sweet-alert.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ReguladorMercadoService } from './../../../services/regulador-mercado.service';
import { ReguladorMercadoComponent } from './../../regulador-mercado/regulador-mercado.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-comprar-tokens',
  templateUrl: './comprar-tokens.component.html',
  styles: [
  ]
})
export class ComprarTokensComponent implements OnInit {

  tokensDisponibles: number = 0;
  compraTokensForm: UntypedFormGroup;

  constructor(public dialogRef: MatDialogRef<ComprarTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: UntypedFormBuilder,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    await this.reguladorMercado.loadBlockChainContractData();

    this.reguladorMercado.getTokensDisponibles().subscribe({
      next: (data) => {
        this.tokensDisponibles = data;
        this.compraTokensForm.get('tokensRegulador').setValue(data);
      }, error: (error) => {
        
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    })
  }

  initForm() {
    this.compraTokensForm = this.fb.group({
      tokensRegulador: [{ value: '', disabled: true }],
      cantidadTokensComprar: ['', Validators.required]
    });
  }

  onSubmit() {
    this.alertDialog.confirmAlert('Confirmar compra', '¿Está seguro de que desea comprar los tokens?').then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.reguladorMercado.postComprarTokens(this.compraTokensForm.get('cantidadTokensComprar').value).subscribe({
          next: () => {
            this.spinner.hide();
            this.dialogRef.close();
            this.toastr.success('Compra realizada con éxito', 'Éxito');
          }, error: (error) => {
            this.spinner.hide();
            this.dialogRef.close();
            console.log(error);
            this.toastr.error(error.message, 'Error');
          }
        })
      }
    })
  }

}