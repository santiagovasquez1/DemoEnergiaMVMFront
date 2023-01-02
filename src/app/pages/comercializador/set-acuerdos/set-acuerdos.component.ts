import { AcuerdoEnergia } from 'src/app/models/AcuerdoEnergia';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { InfoContrato } from 'src/app/models/infoContrato';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import moment from 'moment';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { InfoPlantaEnergia } from 'src/app/models/InfoPlantaEnergia';

@Component({
  selector: 'app-set-acuerdos',
  templateUrl: './set-acuerdos.component.html'
})
export class SetAcuerdosComponent implements OnInit {

  comprarEnergiaForm: FormGroup
  generadores: SolicitudContrato[];
  generadorSeleccionado: SolicitudContrato;
  dirGenerador: string;
  infoCliente: InfoContrato;
  fechaFinContrato: string;
  acuerdoCompra: AcuerdoEnergia
  precioEnergia: number = 0;
  plantasEnergia: InfoPlantaEnergia[];
  capacidadNominalTotal: number = 0;

  constructor(public dialogRef: MatDialogRef<SetAcuerdosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private alertDialog: SweetAlertService,
    private generadorService: GeneradorContractService,
    private spinner: NgxSpinnerService,
    private comercializadorService: ComercializadorContractService,
    private regulardorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private fb: FormBuilder) {
    this.initForm();
    this.acuerdoCompra = this.data.acuerdoCompra as AcuerdoEnergia;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.spinner.show();
      let promises: Promise<void>[] = [];
      promises.push(this.regulardorMercado.loadBlockChainContractData());
      promises.push(this.comercializadorService.loadBlockChainContractData(this.data.dirContrato));
      await Promise.all(promises);
      this.spinner.hide();
      this.getInfoGeneradores();
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar los datos', error.message);
    }
  }

  async loadContractDataGenerador(dirContrato: string){
    let promises: Promise<void>[] = [];
    promises.push(this.generadorService.loadBlockChainContractData(dirContrato))
    await Promise.all(promises);
    this.getPrecioEnergiaByGenerador(this.generadorSeleccionado.infoContrato.owner);
    this.loadPlantasEnergia();
    
  }

  initForm() {
    this.comprarEnergiaForm = this.fb.group({
      generador: ['', Validators.required],
      fechaFin: ['', Validators.required],
    });

    this.comprarEnergiaForm.get('generador').valueChanges.subscribe({
      next: (data: SolicitudContrato) => {
        this.dirGenerador = data.infoContrato.dirContrato;
        this.generadorSeleccionado = data;
        this.loadContractDataGenerador(this.generadorSeleccionado.infoContrato.dirContrato);
      }
    });


    this.comprarEnergiaForm.get('fechaFin').valueChanges.subscribe({
      next: (data: string) => {
        this.fechaFinContrato = data !== '' ? moment(data).format('DD/MM/YYYY') : 'Invalid date';
      }
    });
  }

  private getPrecioEnergiaByGenerador(account: string) {
    this.generadorService.getPrecioEnergiaByGenerador(account).subscribe({
      next: data => {
        this.precioEnergia = data
      },
      error: error => {
        this.toastr.error(error.message, 'Error');
        console.log(error);
      }
    })
  }

  onComprarEnergia() {
    this.alertDialog.confirmAlert('Confirmar', '¿Está seguro de que desea comprar energía?')
      .then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.comercializadorService.realizarAcuerdo(this.dirGenerador, this.acuerdoCompra.dataCliente.dirContrato, this.acuerdoCompra.indexGlobal).subscribe({
            next: () => {
              this.toastr.success("El cuerdo se ha concretado con el generador.", "Transacción exitosa!");
              this.spinner.hide();
              this.dialogRef.close();
            }, error: (error) => {
              console.log(error);
              this.toastr.error(error.message, 'Error');
              this.spinner.hide();
            }
          });
        }
      });
  }

  onCancelar() {
    this.dialogRef.close();
  }

  private getInfoGeneradores() {
    this.spinner.show();
    this.regulardorMercado.getSolicitudesRegistro().subscribe({
      next: (data) => {
        let filterData = data as SolicitudContrato[];
        this.generadores = filterData.filter(item => item.tipoContrato == TiposContratos.Generador);
        this.spinner.hide();
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
        this.spinner.hide();
      }
    });
  }

  get isComprarValid(): boolean {
    let cantidadCompra = this.comprarEnergiaForm.get('cantidadEnergia').value;
    let valorCompra = this.comprarEnergiaForm.get('valorCompra').value;
    let infoEnergia = this.comprarEnergiaForm.get('generador').value as InfoEnergia;
    return this.comprarEnergiaForm.valid && valorCompra <= this.data.tokensDelegados && cantidadCompra <= infoEnergia.cantidadEnergia;
  }

  loadPlantasEnergia() {
    this.generadorService.getPlantasEnergia().subscribe({
      next: (data: InfoPlantaEnergia[]) => {
        this.plantasEnergia = data;

        this.capacidadNominalTotal = 0;
        for(let i = 0; i < this.plantasEnergia.length; i++) 
        {
          this.capacidadNominalTotal += this.plantasEnergia[i].capacidadNominal
        };
      },
      error: (error) => {
        this.toastr.error(error.message, 'Error');
        console.log(error);
      }
    })

  }

}







