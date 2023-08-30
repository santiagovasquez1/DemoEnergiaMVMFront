import { PlantaEnergiaService } from './../../../services/planta-energia.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { DespachosEnergiaService } from 'src/app/services/despachos-energia.service';

import { LanguageService } from 'src/app/services/language.service';
import { forkJoin, Subscription } from 'rxjs';

export enum Estado {
  nuevaEnergia,
  inyectarEnergia
}

@Component({
  selector: 'app-nueva-energia',
  templateUrl: './nueva-energia.component.html'
})
export class NuevaEnergiaComponent implements OnInit {

  tipoEnergia: string = '';
  capacidadNominal: number;
  cantidadActual: number;
  cantidadEnergia: number;
  nuevaEnergiaForm: FormGroup;

  estado: Estado;
  title: string
  cantidadEnergiaContratos: number;
  cantidadEnergiaBolsa: number;
  energiaDespachada: number;
  energiaInyectada: number;

  constructor(public dialogRef: MatDialogRef<NuevaEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generadorContract: GeneradorContractService,
    private despachosEnergia: DespachosEnergiaService,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private languageService: LanguageService) { 

    this.tipoEnergia = this.data.tecnologia;
    this.capacidadNominal = parseInt(this.data.capacidadNominal);
    this.cantidadActual = parseInt(this.data.cantidadActual);

    this.estado = this.data.estado;
    switch (this.estado) {
      case Estado.nuevaEnergia:
        this.title = 'Crear nueva energía';
        break;
      case Estado.inyectarEnergia:
        this.title = 'Inyectar energía';
        break;
    }
    this.initForm();
  }

  // TRADUCTOR
  private languageSubs: Subscription;
//   'Crear nueva energía'
// '¿Está seguro de crear la energía?'
// '¡Energía agregada con éxito!'
// 'Inyectar energía'
// '¿Está seguro de inyectar la energía?'
// '¡Energía inyectada con éxito!'
   titleCreateNewEnergy: string;
  confirmCreateNewEnergy: string;
  successCreateNewEnergy: string;
  titleInjectEnergy: string;
  confirmInjectEnergy: string;
  successInjectEnergy: string;

  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      this.languageService.get('Crear nueva energía'),
      this.languageService.get('¿Está seguro de crear la energía?'),
      this.languageService.get('¡Energía agregada con éxito!'),
      this.languageService.get('Inyectar energía'),
      this.languageService.get('¿Está seguro de inyectar la energía?'),
      this.languageService.get('¡Energía inyectada con éxito!'),
    ]).subscribe({
      next: translatedTexts => {
      console.log('translatedTexts: ', translatedTexts);
      // this.titleToastErrorData = translatedTexts[0];
      this.titleCreateNewEnergy = translatedTexts[0];
      this.confirmCreateNewEnergy = translatedTexts[1];
      this.successCreateNewEnergy = translatedTexts[2];
      this.titleInjectEnergy = translatedTexts[3];
      this.confirmInjectEnergy = translatedTexts[4];
      this.successInjectEnergy = translatedTexts[5];
      },
      error: err => {
        console.log(err);
      }
    })
  }



  async ngOnInit() {

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
      let promises: Promise<any>[] = [];
      promises.push(this.generadorContract.loadBlockChainContractData(this.data.dirContract));
      promises.push(this.despachosEnergia.loadBlockChainContractData());
      await Promise.all(promises);
      this.spinner.hide();
      this.getEnergiaDespachada();
    } catch (error) {
      this.toastr.error(error.message, 'Error');
      this.dialogRef.close();
    }
  }

  initForm() {
    this.nuevaEnergiaForm = this.fb.group({
      nombreEnergia: [{ value: this.tipoEnergia, disabled: true }, Validators.required],
      energiaDespachada: [{ value: '', disabled: true }, Validators.required],
      energiaInyectada: [{ value: '', disabled: true }, Validators.required],
      cantidadEnergia: ['', Validators.required],
      cantidadEnergiaBolsa: ['', Validators.required]
    });

    this.nuevaEnergiaForm.get('cantidadEnergia').valueChanges.subscribe(data => {
      this.cantidadEnergia = data !== '' ? parseInt(data) : 0;
    });
    this.nuevaEnergiaForm.get('cantidadEnergiaBolsa').valueChanges.subscribe(data => {
      this.cantidadEnergia = data !== '' ? parseInt(data) : 0;
    });
  }

  onCrearNuevaEnergia() {
    this.alertDialog.confirmAlert(this.titleCreateNewEnergy, this.confirmCreateNewEnergy).then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
        let nombreEnergia = this.nuevaEnergiaForm.get('nombreEnergia').value;
        let cantidadEnergia = this.nuevaEnergiaForm.get('cantidadEnergia').value;
        this.generadorContract.postCrearNuevaEnergia(nombreEnergia, cantidadEnergia).subscribe(
          {
            next: () => {
              this.spinner.hide();
              this.dialogRef.close();
              this.toastr.success('¡Energía agregada con éxito!');
            },
            error: (err) => {
              this.spinner.hide();
              console.log(err);
              this.toastr.error(err.message, 'Error');
              this.dialogRef.close();
            }
          }
        );
      }
    })
  }

  onInyectarEnergia() {
    this.alertDialog.confirmAlert(this.titleInjectEnergy, this.confirmInjectEnergy).then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
        let nombreEnergia = this.nuevaEnergiaForm.get('nombreEnergia').value;
        this.cantidadEnergiaContratos = this.nuevaEnergiaForm.get('cantidadEnergia').value !== '' ? this.nuevaEnergiaForm.get('cantidadEnergia').value : 0;
        this.cantidadEnergiaBolsa = this.nuevaEnergiaForm.get('cantidadEnergiaBolsa').value !== '' ? this.nuevaEnergiaForm.get('cantidadEnergiaBolsa').value : 0;
        this.cantidadEnergia = this.cantidadEnergiaContratos + this.cantidadEnergiaBolsa;
        const dirPlanta = this.data.hashPlanta;
        this.generadorContract.postInyectarEnergiaPlanta(dirPlanta, nombreEnergia, this.cantidadEnergiaContratos, this.cantidadEnergiaBolsa).subscribe({
          next: () => {
            this.spinner.hide();
            this.dialogRef.close();
            this.toastr.success(this.successInjectEnergy);
          }, error: (err) => {
            this.spinner.hide();
            this.toastr.error(err.message);
            this.dialogRef.close();
          }
        });
      }
    });
  }

  private getEnergiaDespachada() {

    this.spinner.show();
    let timeNow = Math.floor(Date.now() / 1000);
    this.despachosEnergia.getDespachosByGeneradorAndDate(this.data.dirContract, '', timeNow).subscribe({
      next: data => {
        this.energiaDespachada = data.cantidadEnergia;
        this.energiaInyectada = data.cantidadProducida;
        this.nuevaEnergiaForm.get('energiaDespachada').setValue(this.energiaDespachada);
        this.nuevaEnergiaForm.get('energiaInyectada').setValue(this.energiaInyectada);
        this.spinner.hide();
      },
      error: error => {
        this.spinner.hide();
        this.toastr.error(error.message);
        this.spinner.hide();
        this.dialogRef.close();
      }
    })
  }

  get isValid(): boolean {

    if (this.cantidadActual + this.cantidadEnergia <= this.capacidadNominal &&
      this.energiaInyectada + this.cantidadEnergia <= this.energiaDespachada &&
      this.cantidadEnergia > 0) {
      return true;
    } else {
      return false;
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }
}
