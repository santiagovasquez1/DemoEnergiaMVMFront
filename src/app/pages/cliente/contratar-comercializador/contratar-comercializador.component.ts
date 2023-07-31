import { ToastrService } from 'ngx-toastr';
import { InfoContrato } from './../../../models/infoContrato';
import { ClienteContractService } from './../../../services/cliente-contract.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { filter, from, map, take, takeWhile, forkJoin, Subscription } from 'rxjs';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-contratar-comercializador',
  templateUrl: './contratar-comercializador.component.html',
  styles: [
  ]
})
export class ContratarComercializadorComponent implements OnInit, OnDestroy {
  comercializadores: InfoContrato[] = [];
  comercializadorSeleccionado: InfoContrato;
  contratarForm: FormGroup;

  constructor(public dialogRef: MatDialogRef<ContratarComercializadorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reguladorMercado: ReguladorMercadoService,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private languageService: LanguageService) {
    this.contratarForm = this.fb.group({});
  }

  initForm() {
    this.contratarForm = this.fb.group({
      comercializador: ['', [Validators.required]]
    });

    this.contratarForm.get('comercializador').valueChanges.subscribe((data) => {
      this.comercializadorSeleccionado = data !== '' ? data as InfoContrato : null;
    });
  }

  ngOnDestroy(): void { 
  }

  // TRADUCTOR
  private languageSubs: Subscription;
  // variables
  titleModalBuy: string;
  labelModalBuy: string;
  titleToastBuy: string;
  labelToastBuy: string;
  titleToastError: string;
  titleToastErrorData: string;

  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      // this.languageService.get('Error al cargar las plantas de energía'),
      // this.languageService.get('Error'),
      // this.languageService.get('Plantas de energía')
      this.languageService.get('Confirmar contrato'),
      this.languageService.get('¿Está seguro de que desea contratar el comercializador?'),
      this.languageService.get('Contrato contratado con éxito'),
      this.languageService.get('Contrato'),
      this.languageService.get('Error al contratar el comercializador'),
      this.languageService.get('Error al cargar los datos del contrato'),
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.titleModalBuy = translatedTexts[0];
        this.labelModalBuy = translatedTexts[1];
        this.titleToastBuy = translatedTexts[2];
        this.labelToastBuy = translatedTexts[3];
        this.titleToastError = translatedTexts[4];
        this.titleToastErrorData = translatedTexts[5];
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
    this.languageSubs = this.languageService.language.subscribe({
      next: language => {
        this.initializeTranslations();
        console.log('language: ', language);
      },
      error: err => {
        console.log(err);
      }
    });



    this.initForm();
    await this.reguladorMercado.loadBlockChainContractData();
    await this.clienteService.loadBlockChainContractData(this.data.dirContrato);
    this.spinner.show();
    this.reguladorMercado.getContratosRegistrados().pipe(
      map((data) => {
        console.log("DATA DE CONTRATOS: ",data)
        let info = data.filter((item) => item.tipoContrato == TiposContratos.Comercializador
          && item.infoContrato.tipoContrato == TiposContratos.Comercializador)
          .map((item) => item.infoContrato);
        return info;
      })
    ).subscribe({
      next: (data) => {
        this.comercializadores = data;
        this.spinner.hide();
      }, error: (error) => {
        console.log(error);
        this.toastr.error(this.titleToastErrorData, error.message); 3
        this.spinner.hide();
      }
    });
  }

  onContratar() {
    this.alertDialog.confirmAlert(this.titleModalBuy, this.labelModalBuy).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();

        this.clienteService.postContratarComercializador(this.comercializadorSeleccionado.dirContrato).subscribe({
          next: () => {
            this.toastr.success(this.titleToastBuy, this.labelToastBuy);
            this.spinner.hide();
            this.dialogRef.close();
          }, error: (error) => {
            console.log(error);
            this.toastr.error(this.titleToastError, error.message);
            this.spinner.hide();
          }
        });
      }
    })
  }

  get validForm(): boolean {
    return this.comercializadorSeleccionado != null && this.comercializadorSeleccionado.dirContrato !== this.data.comercializador;
  }

}
