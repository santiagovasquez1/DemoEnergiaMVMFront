import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcuerdoEnergia } from 'src/app/models/AcuerdoEnergia';
import { LiquidarContratoComponent } from '../../regulador-mercado/liquidar-contrato/liquidar-contrato.component';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

import { LanguageService } from 'src/app/services/language.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-inyeccion-acuerdo',
  templateUrl: './inyeccion-acuerdo.component.html',
  styles: [
  ]
})
export class InyeccionAcuerdoComponent implements OnInit {

  dirGenerador: string = '';
  cantidadEnergiaBolsa: number = 0;
  energiaAInyectar: number = 0;

  constructor(public dialogRef: MatDialogRef<LiquidarContratoComponent>,
    private generadorService: GeneradorContractService,
    @Inject(MAT_DIALOG_DATA) public data: AcuerdoEnergia,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService,
    private languageService: LanguageService) {
    this.dirGenerador = localStorage.getItem('dirContract');
  }

  // TRADUCTOR
  private languageSubs: Subscription;
  // variables
//   'Inyección energia contrato'
// `¿Deseas inyectar
// Mw al contrato?`
// 'Energía inyectada con exito'
// 'Exito'
  injectEnergy: string = '';
  injectEnergyMessage: string = '';
  injectEnergyMessage2: string = '';
  injectEnergySuccess: string = '';
  injectEnergySuccessTitle: string = '';

  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      this.languageService.get('Inyección energia contrato'),
      this.languageService.get('¿Deseas inyectar'),
      this.languageService.get('Mw al contrato?'),
      this.languageService.get('Energía inyectada con exito'),
      this.languageService.get('Exito')
    ]).subscribe({
      next: translatedTexts => {
      console.log('translatedTexts: ', translatedTexts);
      // this.titleToastErrorData = translatedTexts[0];
      this.injectEnergy = translatedTexts[0];
      this.injectEnergyMessage = translatedTexts[1];
      this.injectEnergyMessage2 = translatedTexts[2];
      this.injectEnergySuccess = translatedTexts[3];
      this.injectEnergySuccessTitle = translatedTexts[4];
      },
      error: err => {
        console.log(err);
      }
    })
  }


  async ngOnInit(): Promise<void> {
    this.spinner.show();
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
      promises.push(this.generadorService.loadBlockChainContractData(this.dirGenerador));
      await Promise.all(promises);
      this.spinner.hide();
      this.getEnergiaEnBolsa();
    } catch (error) {
      console.log(error);
      this.toastr.error(error, 'Error');
      this.spinner.hide();
      this.dialogRef.close();
    }
  }

  private getEnergiaEnBolsa() {
    this.spinner.show();
    this.generadorService.getEnergiaBolsaGenerador().subscribe({
      next: data => {
        this.cantidadEnergiaBolsa = data.filter(item => item.nombre === this.data.tipoEnergia)[0].cantidadEnergia;
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.toastr.error(error, 'Error');
        this.spinner.hide();
        this.dialogRef.close();
      }
    })
  }

  get inyectarIsValid(): boolean {
    return this.energiaAInyectar <= this.cantidadEnergiaBolsa
      && this.energiaAInyectar > 0
      && this.energiaAInyectar + this.data.cantidadEnergiaInyectada <= this.data.cantidadEnergiaTotal
      && this.energiaAInyectar !== null ? true : false;
  }

  onInyectarEnergia() {
    this.alertDialog.confirmAlert(this.injectEnergy, this.injectEnergyMessage + '' + this.energiaAInyectar + ' ' + this.injectEnergyMessage2).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.generadorService.inyectarEnergiaContratos(this.data.dataCliente.dirContrato, this.data.tipoEnergia, this.energiaAInyectar, this.data.indexGlobal).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success(this.injectEnergySuccess, this.injectEnergySuccessTitle);
            this.dialogRef.close();
          },
          error: error => {
            console.log(error);
            this.toastr.error(error, 'Error');
            this.spinner.hide();
            this.dialogRef.close();
          }
        })
      }
    });
  }
}
