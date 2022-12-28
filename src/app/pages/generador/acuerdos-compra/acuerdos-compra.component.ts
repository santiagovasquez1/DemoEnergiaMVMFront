import { InyeccionAcuerdoComponent } from './../inyeccion-acuerdo/inyeccion-acuerdo.component';
import { BancoEnergiaService } from './../../../services/banco-energia.service';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AcuerdoContractService } from 'src/app/services/acuerdo-contract.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { GeneradorContractService } from './../../../services/generador-contract.service';
import { Component, NgZone, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { AcuerdoEnergia, EstadoAcuerdo } from 'src/app/models/AcuerdoEnergia';
import { map } from 'rxjs';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import moment from 'moment';
import { InfoEnergia } from 'src/app/models/InfoEnergia';

@Component({
  selector: 'app-acuerdos-compra',
  templateUrl: './acuerdos-compra.component.html',
  styles: [
  ]
})
export class AcuerdosCompraComponent implements OnInit, OnDestroy {

  dirGenerador: string = '';
  energiasDisponibles: string[] = [];
  energiaBolsaGenerador: InfoEnergia[];
  displayedColumns: string[] = ['empresaCliente', 'empresaComercializador', 'estado', 'fechaInicio', 'fechaFin', 'tipoEnergia', 'energiaTotal', 'energiaEntregada', 'acciones']
  dataSource: MatTableDataSource<AcuerdoEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];
  filters = {
    index: '',
    cliente: '',
    comercializador: '',
    fechaSolicitud: '',
    fechaFin: '',
    tipoEnergia: '',
    estado: undefined
  }

  acuerdoConClienteEvent: any;
  actualizacionContratoEvent: any;
  liquidacionContratoEvent: any;
  inyeccionEnergiaEvent: any;

  constructor(private generador: GeneradorContractService,
    private acuerdosLedger: AcuerdoContractService,
    private bancoEnergia: BancoEnergiaService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private toastr: ToastrService,
    private tableService: TableService) {
    this.dataSource = new MatTableDataSource();
    this.dirGenerador = localStorage.getItem('dirContract');
  }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.acuerdosLedger.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.generador.loadBlockChainContractData(this.dirGenerador));
      await Promise.all(promises);
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.hide();
      this.getEnergiasDisponibles();
      this.getAcuerdosEnergia();
      this.getEnergiasBolsaGenerador();

      this.actualizacionContratoEvent = this.generador.contract.events.actualizacionContrato({
        fromBlock: 'latest'
      }, (error: { message: string; }) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      }).on('data', () => {
        this.ngZone.run(() => {
          this.getAcuerdosEnergia();
        });
      });
      this.acuerdoConClienteEvent = this.generador.contract.events.acuerdoConCliente({
        fromBlock: 'latest'
      }, (error: { message: string; }) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      }).on('data', () => {
        this.ngZone.run(() => {
          this.getAcuerdosEnergia();
        });
      });
      this.liquidacionContratoEvent = this.generador.contract.events.liquidacionContrato({
        fromBlock: 'latest'
      }, (error: { message: string; }) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      }).on('data', () => {
        this.ngZone.run(() => {
          this.getAcuerdosEnergia();
        });
      });
      this.inyeccionEnergiaEvent = this.generador.contract.events.inyeccionEnergia({
        fromBlock: 'latest'
      }, (error: { message: string; }) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      }).on('data', () => {
        this.ngZone.run(() => {
          this.getEnergiasBolsaGenerador();
        });
      });

    } catch (error) {
      console.log(error);
      this.toastr.error(error, 'Error');
      this.spinner.hide();
    }
  }

  ngOnDestroy(): void {
    if (this.acuerdoConClienteEvent) {
      this.acuerdoConClienteEvent.removeAllListeners('data');
    }
    if (this.actualizacionContratoEvent) {
      this.actualizacionContratoEvent.removeAllListeners('data');
    }
    if (this.liquidacionContratoEvent) {
      this.liquidacionContratoEvent.removeAllListeners('data');
    }
    if (this.inyeccionEnergiaEvent) {
      this.inyeccionEnergiaEvent.removeAllListeners('data');
    }
  }

  private getEnergiasDisponibles() {
    this.spinner.show();
    this.bancoEnergia.getTiposEnergiasDisponibles().pipe(
      map(data => data.map(item => item.nombre))
    ).subscribe({
      next: data => {
        this.energiasDisponibles = data;
        this.setFilterForm();
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    })
  }

  private setFilterForm() {

    this.filterFormProperties = [{
      fields: [{
        label: 'Index',
        formControlName: 'index',
        controlType: 'number',
        pipe: ''
      }, {
        label: 'Cliente',
        formControlName: 'cliente',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Comercializador',
        formControlName: 'comercializador',
        controlType: 'text',
        pipe: ''
      }]
    }, {
      fields: [{
        label: 'Fecha de solicitud',
        formControlName: 'fechaSolicitud',
        controlType: 'date',
        pipe: ''
      }, {
        label: 'Fecha fin',
        formControlName: 'fechaFin',
        controlType: 'date',
        pipe: ''
      }, {
        label: 'Tipo de energia',
        formControlName: 'tipoEnergia',
        controlType: 'select',
        optionValues: this.energiasDisponibles,
        pipe: ''
      }, {
        label: 'Estado de compra',
        formControlName: 'estado',
        controlType: 'select',
        optionValues: Object.values(EstadoAcuerdo).filter(item => typeof item == 'number'),
        pipe: 'estadoCompra'
      }]
    }];
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'fechaCompra' || event.controlName === 'fechaSolicitud') {
      if (event.controlName == 'fechaCompra') {
        this.filters.fechaFin = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
      } else {
        this.filters.fechaSolicitud = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
      }
    } else if (event.controlName === 'estado') {
      this.filters.estado = event.data !== '' ? parseInt(event.data) : '';
    } else {
      this.filters[event.controlName] = event.data
    }
    this.getAcuerdosEnergia();
  }

  getAcuerdosEnergia() {
    this.spinner.show();
    this.acuerdosLedger.getAcuerdosDeCompraByGenerador(this.dirGenerador).subscribe({
      next: data => {
        const filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }

  private filterData(data: AcuerdoEnergia[]): AcuerdoEnergia[] {
    let filterArray = data;

    filterArray = this.filters.index !== '' && this.filters.index !== null ? filterArray.filter(item => item.indexGlobal === parseInt(this.filters.index)) : filterArray;
    filterArray = this.filters.cliente !== '' ? filterArray.filter(item => item.dataCliente.nombreAgente.toLowerCase().includes(this.filters.cliente)) : filterArray;
    filterArray = this.filters.comercializador !== '' ? filterArray.filter(item => item.dataComercializador.nombreAgente.toLowerCase().includes(this.filters.comercializador)) : filterArray;
    filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.tipoEnergia.toLowerCase().includes(this.filters.tipoEnergia)) : filterArray;
    filterArray = this.filters.fechaSolicitud !== 'Invalid date' && this.filters.fechaSolicitud !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaInicio, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaSolicitud, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    filterArray = this.filters.fechaFin !== 'Invalid date' && this.filters.fechaFin !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaFin, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaFin, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    filterArray = this.filters.estado !== undefined && this.filters.estado !== '' ? filterArray.filter(item => item.estadoAcuerdo == this.filters.estado) : filterArray;
    return filterArray;
  }

  private getEnergiasBolsaGenerador() {
    this.spinner.show();
    this.generador.getEnergiaBolsaGenerador().subscribe({
      next: data => {
        this.energiaBolsaGenerador = data;
        this.spinner.hide();
      },
      error: error => {
        this.toastr.error(error.message, 'Error');
        console.log(error);
        this.spinner.hide();
      }
    })
  }

  onInyectarEnergiaContrato(acuerdoEnergia: AcuerdoEnergia) {
    const dialogReg = this.dialog.open(InyeccionAcuerdoComponent, {
      width: '500px',
      data: acuerdoEnergia
    });

    dialogReg.afterClosed().subscribe({
      next:()=>{
        this.getAcuerdosEnergia();
        this.getEnergiasBolsaGenerador();
      }
    })
  }
}
