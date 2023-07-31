import { UntypedFormGroup, UntypedFormBuilder, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { Observable, Subscription, timer, filter } from 'rxjs';

import { LanguageService } from 'src/app/services/language.service';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-fijar-precios',
  templateUrl: './fijar-precios.component.html'
})
export class FijarPreciosComponent implements OnInit, OnDestroy {
  // TRADUCCION
  private languageSubs: Subscription;
  // variables
  errorToastData: string;
  titleModalConfirm: string;
  labelModalConfirm: string;
  titleToastFixedPrice: string;
  labelToastFixedPrice: string;

  tokensDelegados: number;
  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];

  constructor(public dialogRef: MatDialogRef<FijarPreciosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private clienteService: ClienteContractService,
    private generadorContract: GeneradorContractService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private bancoEnergia: BancoEnergiaService,
    private languageService: LanguageService) {
    this.tokensDelegados = this.data.tokensDelegados;
    this.initForm();
  }

  ngOnDestroy(): void {
   
  }

  initializeTranslations(): void {
    forkJoin([
      this.languageService.get('Error al cargar los datos'),
      this.languageService.get('Confirmar'),
      this.languageService.get('¿Está seguro de que desea fijar el precio?'),
      this.languageService.get('Fijación de precio'),
      this.languageService.get('Éxito')
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.errorToastData = translatedTexts[0];
        this.titleModalConfirm = translatedTexts[1];
        this.labelModalConfirm = translatedTexts[2];
        this.titleToastFixedPrice = translatedTexts[3];
        this.labelToastFixedPrice = translatedTexts[4];
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
          this.toastr.error(error.message, 'Error');
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(this.errorToastData, error.message);
    }
  }

  private onEnergiaChange() {

  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      valorEnergia: ['', Validators.required],
    });
  }

  onFijarPrecio() {
    this.alertDialog.confirmAlert(this.titleModalConfirm, this.labelModalConfirm)
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          let precioEnergia = this.comprarEnergiaForm.get('valorEnergia').value;
          if(this.data.setPrecio == 'bolsa'){
            this.bancoEnergia.setPrecioVentaEnergia(precioEnergia).subscribe({
              next: () => {
                this.spinner.hide();
                this.toastr.success(this.titleToastFixedPrice, this.labelToastFixedPrice);
                this.dialogRef.close();
                this.bancoEnergia.getPrecioVentaEnergia().subscribe({
                  next: (data) => {
                    this.spinner.hide();
                    this.dialogRef.close();
                  }, error: (error) => {
                    this.spinner.hide();
                    this.toastr.error(error.message, 'Error');
                  }
                });
              },error: (error) => {
                this.spinner.hide();
                this.toastr.error(error.message, 'Error');
              }
            });


          }
          else if(this.data.setPrecio == 'generador'){
            this.generadorContract.setPrecioEnergia(precioEnergia).subscribe({
              next: () => {
                this.spinner.hide();
                this.toastr.success(this.titleToastFixedPrice, this.labelToastFixedPrice);
                this.dialogRef.close();
              }, error: (error) => {
                this.spinner.hide();
                this.toastr.error(error.message, 'Error');
              }
            });
          }

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
