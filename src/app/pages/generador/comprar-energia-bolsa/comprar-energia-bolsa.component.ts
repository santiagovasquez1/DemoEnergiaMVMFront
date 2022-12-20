import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { forkJoin, switchMap } from 'rxjs';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';

@Component({
  selector: 'app-comprar-energia-bolsa',
  templateUrl: './comprar-energia-bolsa.component.html',
  styleUrls: []
})
export class ComprarEnergiaBolsaComponent implements OnInit {

  comprarEnergiaForm: FormGroup
  tiposEnergia: InfoEnergia[] = [];
  selectedEnergia: InfoEnergia;
  cantidadEnergia: number = 0;
  precioCompra: number = 0;
  tokensGenerador: number = 0;

  constructor(public dialogRef: MatDialogRef<ComprarEnergiaBolsaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private generadorService: GeneradorContractService,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private bancoEnergia: BancoEnergiaService) {
    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.spinner.show()
      let promises: Promise<void>[] = [];
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.generadorService.loadBlockChainContractData(this.data.dirContract));
      await Promise.all(promises);

      forkJoin([
        this.bancoEnergia.getTiposEnergiasDisponibles(),
        this.generadorService.getInfoContrato().pipe(
          switchMap(data => {
            return this.reguladorMercado.getTokensAgente(data.owner);
          })
        )
      ]).subscribe({
        next: data => {
          this.tiposEnergia = data[0];
          this.tokensGenerador = data[1];
          this.comprarEnergiaForm.get('tokensGenerador').setValue(this.tokensGenerador);
          this.spinner.hide();
        },
        error: error => {
          console.log(error);
          this.spinner.hide();
          this.toastr.error(error.message, 'Error');
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
    }
  }

  private onEnergiaChange() {
    this.selectedEnergia = this.comprarEnergiaForm.get('tipoEnergia').value == '' ? null : this.comprarEnergiaForm.get('tipoEnergia').value as InfoEnergia;
    this.cantidadEnergia = this.comprarEnergiaForm.get('cantidadEnergia').value == '' ? 0 : parseInt(this.comprarEnergiaForm.get('cantidadEnergia').value);

    if (this.cantidadEnergia > 0 && this.selectedEnergia) {
      this.spinner.show();
      this.bancoEnergia.getPrecioVentaEnergia().subscribe({
        next: precio => {
          this.precioCompra = precio * this.cantidadEnergia;
          this.comprarEnergiaForm.get('valorCompra').setValue(this.precioCompra);
          this.spinner.hide();
        },
        error: error => {
          console.log(error);
          this.toastr.error('Error al cargar los datos', error.message);
        }
      })
    }
    this.comprarEnergiaForm.get('valorCompra').setValue(this.precioCompra);
  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      tipoEnergia: ['', Validators.required],
      cantidadEnergia: ['', Validators.required],
      valorCompra: [{ value: 0, disabled: true }, Validators.required],
      tokensGenerador: [{ value: '', disabled: true }, Validators.required]
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
  }

  onComprarEnergia() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea comprar energía?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.generadorService.postCompraEnergiaBolsa(this.cantidadEnergia, this.selectedEnergia.nombre).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success('Energía comprada con exito', 'Exito');
              this.dialogRef.close();
            },
            error: error => {
              console.log(error);
              this.spinner.hide();
              this.toastr.error(error.message, 'Error');
              this.dialogRef.close();
            }
          })
        }
      });
  }

  onCancelar() {
    this.dialogRef.close();
  }

  get isComprarValid(): boolean {
    return this.precioCompra <= this.tokensGenerador ? true : false
  }

}
