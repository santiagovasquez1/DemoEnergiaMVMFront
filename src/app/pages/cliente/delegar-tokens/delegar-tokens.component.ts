import { ToastrService } from 'ngx-toastr';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-delegar-tokens',
  templateUrl: './delegar-tokens.component.html',
  styles: [
  ]
})
export class DelegarTokensComponent implements OnInit {
  tokensCliente: number = 0;
  delegarTokensForm: FormGroup;
  constructor(public dialogReg: MatDialogRef<DelegarTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.reguladorMercado.loadBlockChainContractData();
      this.tokensCliente = this.data.tokensCliente;      
      this.delegarTokensForm.get('cantidadTokensCliente').setValue(this.tokensCliente);
      this.delegarTokensForm.get('cantidadTokensDelegados').setValue(this.data.tokensDelegados);
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  initForm() {
    this.delegarTokensForm = this.fb.group({
      cantidadTokensCliente: [{ value: '', disabled: true }],
      cantidadTokensDelegados: [{ value: '', disabled: true }],
      cantidadTokensDelegar: ['', Validators.required]
    });
  }

  onDelegarTokens(){
    this.alertDialog.confirmAlert('Confirmar delegación', '¿Está seguro de que desea delegar los tokens?').then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        let tokensDelegados = this.delegarTokensForm.get('cantidadTokensDelegar').value;
        let delegateAddress = this.data.delegateAddress;
        this.reguladorMercado.postDelegarTokens(delegateAddress,tokensDelegados).subscribe({
          next: () => {
            this.spinner.hide();
            this.dialogReg.close();
          }
        })
      }
    }).catch((error) => {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    });
  }

  get isValid(): boolean {
    return this.delegarTokensForm.valid && this.delegarTokensForm.get('cantidadTokensDelegar').value + this.data.tokensDelegados <= this.tokensCliente;
  }
}
