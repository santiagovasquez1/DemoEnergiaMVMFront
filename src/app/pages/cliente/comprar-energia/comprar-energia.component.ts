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
  selector: 'app-comprar-energia',
  templateUrl: './comprar-energia.component.html',
  styles: [
  ]
})
export class ComprarEnergiaComponent implements OnInit, OnDestroy {

  tokensDelegados: number;
  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];

  constructor(public dialogRef: MatDialogRef<ComprarEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private bancoEnergia: BancoEnergiaService,
    public languageService: LanguageService) {
    this.tokensDelegados = this.data.tokensDelegados;
    this.initForm();
  }

  ngOnDestroy(): void {
  }

  // TRADUCTOR
  private languageSubs: Subscription;
  // variables
  titleToastErrorData: string;
  labelToastErrorData: string;
  titleModalBuy: string;
  labelModalBuy1: string;
  titleToastSuccess: string;
  labelToastSuccess: string;

  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      // this.languageService.get('Error al cargar las plantas de energía'),
      // this.languageService.get(this.labelToastErrorData),
      // this.languageService.get('Plantas de energía')
      this.languageService.get('Error al cargar los datos'),
      this.languageService.get('Error'),
      this.languageService.get('Confirmar'),
      this.languageService.get('¿Está seguro de que desea comprar energía?'),
      this.languageService.get('Emision de compra de energia'),
      this.languageService.get('Éxito')
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.titleToastErrorData = translatedTexts[0];
        this.labelToastErrorData = translatedTexts[1];
        this.titleModalBuy = translatedTexts[2];
        this.labelModalBuy1 = translatedTexts[3];
        this.titleToastSuccess = translatedTexts[4];
        this.labelToastSuccess = translatedTexts[5];
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
          this.toastr.error(error.message, this.labelToastErrorData);
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
      this.toastr.error(this.titleToastErrorData, error.message);
    }
  }

  private onEnergiaChange() {
    let tipoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value == '' ? null : this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
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
      // valorCompra: [{ value: '', disabled: true }, Validators.required],
      // tokensDelegados: [{ value: this.tokensDelegados, disabled: true }, Validators.required],
    });
  }

  onComprarEnergia() {
    this.alertDialog.confirmAlert(this.titleModalBuy, this.labelModalBuy1)
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          let infoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
          let cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value;
          let fechaFin = Date.now() /1000;
          this.clienteService.postComprarEnergia(infoEnergia.nombre, cantidadEnergia,fechaFin).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success(this.titleToastSuccess, this.labelToastSuccess);
              this.dialogRef.close();
            }, error: (error) => {
              this.spinner.hide();
              this.toastr.error(error.message, this.labelToastErrorData);
            }
          });
        }
      });
  }

  onCancelar() {
    this.dialogRef.close();
  }

  get isComprarValid(): boolean {
    let cantidadCompra = this.comprarEnergiaForm.get('cantidadEnergia').value;
    let valorCompra = this.comprarEnergiaForm.get('valorCompra').value;
    let infoEnergia = this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
    return this.comprarEnergiaForm.valid && valorCompra <= this.data.tokensDelegados && cantidadCompra <= infoEnergia.cantidadEnergia;
  }

}