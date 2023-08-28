import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { ToastrService } from 'ngx-toastr';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';

import {LanguageService} from '../../../services/language.service';
import {forkJoin, Subscription} from 'rxjs';

@Component({
  selector: 'app-liquidar-inyeccion',
  templateUrl: './liquidar-inyeccion.component.html',
  styles: [
  ]
})
export class LiquidarInyeccionComponent implements OnInit, OnDestroy {

  liquidarEnergiaForm: FormGroup;
  fechaLiquidacion: string = '';
  fechaLiquidacionMiliseconds: string = '';
  constructor(public dialogRef: MatDialogRef<LiquidarInyeccionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private bancoEnergia: BancoEnergiaService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService,
    public languageService: LanguageService) {
    this.initForm();
  }

  ngOnDestroy(): void {
  }

//   'Liquidacion de inyecciones'
// `Desea liquidar todas las inyecciones realizadas en la fecha

  private languageSubs: Subscription;
  settleModalTitle: string;
  settleModalLabel: string;

  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      // this.languageService.get('Error al cargar las plantas de energía'),
      // this.languageService.get('Error'),
      // this.languageService.get('Plantas de energía')
      this.languageService.get('Liquidacion de inyecciones'),
      this.languageService.get('Desea liquidar todas las inyecciones realizadas en la fecha')
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.settleModalTitle = translatedTexts[0];
        this.settleModalLabel = translatedTexts[1];
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

    this.spinner.show();
    await this.bancoEnergia.loadBlockChainContractData();
    this.spinner.hide();
  }

  initForm() {
    this.liquidarEnergiaForm = this.fb.group({
      fechaLiquidacion: [this.fechaLiquidacion, Validators.required]
    });

    this.liquidarEnergiaForm.get('fechaLiquidacion').valueChanges.subscribe({
      next: data => {
        this.fechaLiquidacion = data !== '' ? moment(data).format('DD/MM/YYYY') : 'Invalid date';
        this.fechaLiquidacionMiliseconds = data !== '' ? moment(data).format('x') : 'Invalid date';
      }
    })
  }

  onLiquidarInyecciones() {
    this.alertDialog.confirmAlert(this.settleModalTitle, this.settleModalLabel + ' ' + this.fechaLiquidacion).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        const timeStamp = parseInt(this.fechaLiquidacionMiliseconds) / 1000;
        this.bancoEnergia.liquidarInyecciones(timeStamp).subscribe({
          next: () => {
            this.dialogRef.close();
            this.spinner.hide();
          },
          error: error => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
            this.spinner.hide();
            this.dialogRef.close();
          }
        })
      }
    })


  }

  onCancelar() {
    this.dialogRef.close();
  }
}
