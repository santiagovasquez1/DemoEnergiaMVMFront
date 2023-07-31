import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';

import { LanguageService } from 'src/app/services/language.service';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-comprar-tokens',
  templateUrl: './comprar-tokens.component.html'
})
export class ComprarTokensComponent implements OnInit, OnDestroy {

  cantidadTokens: number;
  compraTokensForm: FormGroup

  constructor(public dialogRef: MatDialogRef<ComprarTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    public languageService: LanguageService) {
    this.initForm();
  }

  ngOnDestroy(): void {
  }


  // 'Error al cargar los datos'
  // 'Confirmar'
  // `¿Está seguro de que desea comprar ${this.cantidadTokens} Tokens?`
  // 'Compra de tokens realizada'
  // 'Exito'
// TRADUCTOR
  private languageSubs: Subscription;
  // variables
  titleToastErrorData: string;
  titleModalBuy: string;
  labelModalBuy1: string;
  titleToastSuccess: string;
  labelToastSuccess: string;


initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      // this.languageService.get('Error al cargar las plantas de energía'),
      // this.languageService.get('Error'),
      // this.languageService.get('Plantas de energía')
      this.languageService.get('Error al cargar los datos'),
      this.languageService.get('Confirmar'),
      this.languageService.get('¿Está seguro de que desea comprar'),
      this.languageService.get('Compra de tokens realizada'),
      this.languageService.get('Exito'),

    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.titleToastErrorData = translatedTexts[0];
        this.titleModalBuy = translatedTexts[1];
        this.labelModalBuy1 = translatedTexts[2];
        this.titleToastSuccess = translatedTexts[3];
        this.labelToastSuccess = translatedTexts[4];

        // this.titleToastErrorData = translatedTexts[0];
        // this.labelToastErrorData = translatedTexts[1];
        // this.tipoMapa = translatedTexts[2];
      },
      error: err => {
        console.log(err);
      }
    })
  }


  async ngOnInit(): Promise<void> {
    try {
      this.languageSubs = this.languageService.language.subscribe({
        next: language => {
          this.initializeTranslations();
          console.log('language: ', language);
        },
        error: err => {
          console.log(err);
        }
      });

      this.spinner.show();
      let promises: Promise<void>[] = [];
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      await Promise.all(promises);
      this.spinner.hide();
    } catch (error) {
      console.log(error);
      this.toastr.error(this.titleToastErrorData, error.message);
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
    this.alertDialog.confirmAlert(this.titleModalBuy, this.labelModalBuy1 + this.cantidadTokens + ' Tokens?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.reguladorMercado.postComprarTokens(this.cantidadTokens).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success(this.titleToastSuccess, this.labelToastSuccess);
              this.dialogRef.close();
            },
            error:error=>{
              console.log(error);
              this.toastr.error(this.titleToastErrorData, error.message);
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
