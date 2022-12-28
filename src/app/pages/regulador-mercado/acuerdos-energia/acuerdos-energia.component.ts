import { LiquidarContratoComponent } from './../liquidar-contrato/liquidar-contrato.component';
import { CdkColumnDef } from '@angular/cdk/table';
import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { AcuerdoEnergia, EstadoAcuerdo } from 'src/app/models/AcuerdoEnergia';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { AcuerdoContractService } from 'src/app/services/acuerdo-contract.service';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { TableService } from 'src/app/services/shared/table-service.service';

@Component({
  selector: 'app-acuerdos-energia',
  templateUrl: './acuerdos-energia.component.html',
  styles: [
  ]
})
export class AcuerdosEnergiaComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['empresaCliente', 'empresaComercializador', 'empresaGenerador', 'estado', 'fechaInicio', 'fechaFin', 'tipoEnergia', 'energiaTotal', 'energiaEntregada', 'acciones']
  energiasDisponibles: string[];
  dataSource: MatTableDataSource<AcuerdoEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];
  filters = {
    index: '',
    cliente: '',
    comercializador: '',
    generador: '',
    fechaSolicitud: '',
    fechaFin: '',
    tipoEnergia: '',
    estado: undefined
  }
  creacionAcuerdoEvent: any;
  actualizacionAcuerdoEvent: any;

  constructor(private bancoEnergia: BancoEnergiaService,
    private acuerdosLedger: AcuerdoContractService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private toastr: ToastrService,
    private tableService: TableService,) {
    this.dataSource = new MatTableDataSource();
  }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.acuerdosLedger.loadBlockChainContractData());
      await Promise.all(promises);
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.hide();
      this.getEnergiasDisponibles();
      this.getAcuerdosEnergia();
      this.creacionAcuerdoEvent = this.acuerdosLedger.contract.events.creacionAcuerdo({
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
      this.actualizacionAcuerdoEvent = this.acuerdosLedger.contract.events.actualizacionAcuerdo({
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
    } catch (error) {
      console.log(error);
      this.toastr.error(error, 'Error');
      this.spinner.hide();
    }
  }

  ngOnDestroy(): void {
    if (this.creacionAcuerdoEvent) {
      this.creacionAcuerdoEvent.removeAllListeners('data');
    }
    if (this.actualizacionAcuerdoEvent) {
      this.actualizacionAcuerdoEvent.removeAllListeners('data');
    }
  }

  private getAcuerdosEnergia() {
    this.spinner.show();
    this.acuerdosLedger.getAcuerdosDeCompraMercado().subscribe({
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
    })
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
      }, {
        label: 'Generador',
        formControlName: 'generador',
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

  onLiquidarContrato(acuerdoEnergia: AcuerdoEnergia) {
    const liquidacionDialog = this.dialog.open(LiquidarContratoComponent, {
      width: '500px',
      data: acuerdoEnergia
    });
    liquidacionDialog.afterClosed().subscribe({
      next: () => {
        this.getAcuerdosEnergia();
      }
    });
  }

  private filterData(data: AcuerdoEnergia[]): AcuerdoEnergia[] {
    let filterArray = data;

    filterArray = this.filters.index !== '' && this.filters.index !== null ? filterArray.filter(item => item.indexGlobal === parseInt(this.filters.index)) : filterArray;
    filterArray = this.filters.cliente !== '' ? filterArray.filter(item => item.dataCliente.nombreAgente.toLowerCase().includes(this.filters.cliente)) : filterArray;
    filterArray = this.filters.comercializador !== '' ? filterArray.filter(item => item.dataComercializador.nombreAgente.toLowerCase().includes(this.filters.comercializador)) : filterArray;
    filterArray = this.filters.generador !== '' ? filterArray.filter(item => item.dataGenerador.nombreAgente.toLowerCase().includes(this.filters.generador)) : filterArray;
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
}
