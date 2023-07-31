import { SweetAlertService } from './../../../services/sweet-alert.service';
import { from, switchMap } from 'rxjs';
import { TableService } from 'src/app/services/shared/table-service.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { BancoEnergiaService } from './../../../services/banco-energia.service';
import { NuevaEnergiaComponent, Estado } from './../nueva-energia/nueva-energia.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { InfoPlantaEnergia, EstadoPlanta } from './../../../models/InfoPlantaEnergia';
import { Component, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import moment from 'moment';
import { PlantasEnergiaComponent } from '../plantas-energia/plantas-energia.component';
import { ComprarEnergiaBolsaComponent } from '../comprar-energia-bolsa/comprar-energia-bolsa.component';
import { FijarPreciosComponent } from '../fijar-precios/fijar-precios.component';
import { DespachosEnergiaService } from 'src/app/services/despachos-energia.service';
import { PlantaEnergiaService } from 'src/app/services/planta-energia.service';

import { LanguageService } from 'src/app/services/language.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-lista-plantas',
  templateUrl: './lista-plantas.component.html',
  styles: [
  ]
})
export class ListaPlantasComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['nombre', 'ubicacion', 'coordenadas', 'fechaOperacion', 'tasaEmision', 'capacidad', 'tecnologia', 'cantidad', 'estado', 'acciones'];
  ubicaciones: string[] = []
  estadosPlantas: EstadoPlanta[];
  dirContract: string;
  nombreGenerador: string;
  energiasDisponibles: string[] = [];
  cantidadEnergiaDepachada: number = 0;
  energiaBolsaGenerador: InfoEnergia[];
  dataSource: MatTableDataSource<InfoPlantaEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;
  precioEnergia: number = 0;
  filterFormProperties: RowFilterForm[] = [];

  filters = {
    nombrePlanta: '',
    ubicacion: '',
    fechaOperacion: '',
    tipoEnergia: '',
    estadoPlanta: undefined
  }
  ordenDespachoEvent: any;
  inyeccionEnergiaEvent: any;

  constructor(
    private generadorService: GeneradorContractService,
    private despachosEnergia: DespachosEnergiaService,
    private alertDialog: SweetAlertService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private bancoEnergia: BancoEnergiaService,
    private tableService: TableService,
    private ngZone: NgZone,
    private plantaEnergia: PlantaEnergiaService,
    private languageService: LanguageService) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnDestroy(): void {
    if (this.ordenDespachoEvent) {
      this.ordenDespachoEvent.removeAllListeners('data');
    }
    if (this.inyeccionEnergiaEvent) {
      this.inyeccionEnergiaEvent.removeAllListeners('data');
    }
  }



  private setFilterForm() {
    this.filterFormProperties = [{
      fields: [{
        label: 'Nombre',
        formControlName: 'nombrePlanta',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Ubicación',
        formControlName: 'ubicacion',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Fecha inicio operaciones',
        formControlName: 'fechaOperacion',
        controlType: 'date',
        pipe: ''
      }]
    }, {
      fields: [{
        label: ' Tecnologia de la planta',
        formControlName: 'tipoEnergia',
        controlType: 'select',
        pipe: '',
        optionValues: this.energiasDisponibles
      }, {
        label: 'Estado de la planta',
        formControlName: 'estadoPlanta',
        controlType: 'select',
        pipe: 'estadoPlanta',
        optionValues: this.estadosPlantas
      }]
    }];
  }

  // TRADUCTOR
  private languageSubs: Subscription;
  // variables
  //   'Error al cargar las plantas de energía', 'Error'
  // 'Reinicio producción', `¿Deseas reiniciar la producción de la planta de energia ${plantaEnergia.nombre}?`
  // `Se ha reiniciado la producción de la planta ${plantaEnergia.nombre}`, 'Exito'
  titleToastError: string;
  labelToastError: string;
  titleModalReset: string;
  labelModalReset: string;
  titleToastSuccess: string;
  labelToastSuccess: string;

  initializeTranslations(): void {
    forkJoin([
      this.languageService.get('Error al cargar las plantas de energía'),
      this.languageService.get('Error'),
      this.languageService.get('Reinicio producción'),
      this.languageService.get('¿Deseas reiniciar la producción de la planta de energia'),
      this.languageService.get('Se ha reiniciado la producción de la planta'),
      this.languageService.get('Exito')
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.titleToastError = translatedTexts[0];
        this.labelToastError = translatedTexts[1];
        this.titleModalReset = translatedTexts[2];
        this.labelModalReset = translatedTexts[3];
        this.titleToastSuccess = translatedTexts[4];
        this.labelToastSuccess = translatedTexts[5];
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
      this.dirContract = localStorage.getItem('dirContract');

      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.despachosEnergia.loadBlockChainContractData());
      promises.push(this.generadorService.loadBlockChainContractData(this.dirContract));
      
      await Promise.all(promises);
      this.spinner.hide();
      this.tableService.setPaginatorTable(this.paginator);
      this.loadSelectsOptions();
      this.loadPlantasEnergia();
      this.getTotalEnergiaDespachada();
      this.getPrecioEnergia();
      this.getEnergiasBolsaGenerador();
      this.ordenDespachoEvent = this.despachosEnergia.contract.events.ordenDespacho({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, this.labelToastError);
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getTotalEnergiaDespachada()
        })
      });

      this.inyeccionEnergiaEvent = this.despachosEnergia.contract.events.inyeccionEnergia({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, this.labelToastError);
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getTotalEnergiaDespachada()
        })
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(this.titleToastError, this.labelToastError);
    }
  }

  loadPlantasEnergia() {
    this.generadorService.getPlantasEnergia().subscribe({
      next: (data: InfoPlantaEnergia[]) => {
        const filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.ubicaciones = filterData.map(item => {
          return `${item.ciudad} ${item.departamento}`
        });
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
      },
      error: (error) => {
        this.toastr.error(error.message, this.labelToastError);
        console.log(error);
      }
    })

  }

  private loadSelectsOptions() {
    const tempEstadosPlantas = Object.values(EstadoPlanta).filter(item => typeof item == 'number');
    this.estadosPlantas = tempEstadosPlantas as EstadoPlanta[];
    this.spinner.show();
    this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
      next: (data: InfoEnergia[]) => {
        this.energiasDisponibles = data.map(item => item.nombre);
        this.setFilterForm();
        this.spinner.hide();
      },
      error: (error) => {
        this.toastr.error(error.message, this.labelToastError);
        console.log(error);
        this.spinner.hide();
      }
    })
  }

  private getTotalEnergiaDespachada() {
    const timeNow = Math.floor(new Date().getTime() / 1000);
    this.despachosEnergia.getDespachosByGeneradorAndDate(this.dirContract, '', timeNow).subscribe({
      next: data => {
        this.cantidadEnergiaDepachada = data.cantidadEnergia
      },
      error: error => {
        this.toastr.error(error.message, this.labelToastError);
        console.log(error);
      }
    })
  }

  private getPrecioEnergia() {
    this.generadorService.getPrecioEnergia().subscribe({
      next: data => {
        this.precioEnergia = data
      },
      error: error => {
        this.toastr.error(error.message, this.labelToastError);
        console.log(error);
      }
    })
  }

  onInyectarEnergia(planta: InfoPlantaEnergia) {
    let dialogRef = this.dialog.open(NuevaEnergiaComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        nombreGenerador: this.nombreGenerador,
        hashPlanta: planta.dirPlanta,
        tecnologia: planta.tecnologia,
        capacidadNominal: planta.capacidadNominal,
        cantidadActual: planta.cantidadEnergia,
        estado: Estado.inyectarEnergia
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.loadPlantasEnergia();
        this.getEnergiasBolsaGenerador();
      }
    });
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'estadoPlanta') {
      this.filters[event.controlName] = event.data !== '' ? parseInt(event.data) : event.data;
    } else if (event.controlName === 'fechaOperacion') {
      this.filters[event.controlName] = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date'
    }
    else {
      this.filters[event.controlName] = event.data;
    }
    this.loadPlantasEnergia();
  }

  private filterData(data: InfoPlantaEnergia[]): InfoPlantaEnergia[] {
    let filterArray = data;
    filterArray = this.filters.nombrePlanta !== '' ? filterArray.filter(item => item.nombre.toLowerCase().includes(this.filters.nombrePlanta.toLowerCase())) : filterArray;
    filterArray = this.filters.ubicacion !== '' ? filterArray.filter(item => item.departamento.toLowerCase().includes(this.filters.nombrePlanta.toLowerCase())) : filterArray;
    filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.tecnologia === this.filters.tipoEnergia) : filterArray;
    filterArray = this.filters.estadoPlanta !== '' && this.filters.estadoPlanta !== undefined ? filterArray.filter(item => item.estado == this.filters.estadoPlanta) : filterArray;
    filterArray = this.filters.fechaOperacion !== 'Invalid date' && this.filters.fechaOperacion !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaInicio, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaOperacion, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    return filterArray;
  }

  onCrearPlanta() {
    const dialogRef = this.dialog.open(PlantasEnergiaComponent, {
      width: '800px',
      data: {
        dirContract: this.dirContract,
        nombreGenerador: this.nombreGenerador,
        energiasDisponibles: this.energiasDisponibles
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.loadPlantasEnergia();
        this.getEnergiasBolsaGenerador();
      }
    })
  }

  onComprarEnergia() {
    const dialogRef = this.dialog.open(ComprarEnergiaBolsaComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        nombreGenerador: this.nombreGenerador,
        energiasDisponibles: this.energiasDisponibles
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getEnergiasBolsaGenerador();
      }
    })
  }

  onFijarPrecios() {
    const dialogRef = this.dialog.open(FijarPreciosComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        nombreGenerador: this.nombreGenerador,
        energiasDisponibles: this.energiasDisponibles,
        setPrecio: 'generador'
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getPrecioEnergia();
      }
    })
  }

  onReiniciarProduccion(plantaEnergia: InfoPlantaEnergia) {
    this.alertDialog.confirmAlert(this.titleModalReset, this.labelModalReset + plantaEnergia.nombre + '?').then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.generadorService.resetProduccionPlanta(plantaEnergia.dirPlanta).subscribe({
          next: () => {
            this.loadPlantasEnergia();
            this.spinner.hide();
            this.toastr.success(this.titleToastSuccess +' ' + plantaEnergia.nombre, this.labelToastSuccess);
          },
          error: error => {
            this.spinner.hide();
            this.toastr.error(error.message, this.labelToastError);
            console.log(error);
          }
        });
      }
    })

  }

  getEnergiasBolsaGenerador() {
    this.spinner.show();
    this.generadorService.getEnergiaBolsaGenerador().subscribe({
      next: data => {
        this.energiaBolsaGenerador = data;
        console.log(this.energiaBolsaGenerador)
        this.spinner.hide();
      },
      error: error => {
        this.toastr.error(error.message, this.labelToastError);
        console.log(error);
        this.spinner.hide();
      }
    })
  }
}
