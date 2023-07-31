import { AcuerdoContractService } from 'src/app/services/acuerdo-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { InfoCompraEnergia } from './../../../models/InfoCompraEnergia';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { Component, NgZone, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { InfoCertificadoCompraComponent } from 'src/app/shared/info-certificado-compra/info-certificado-compra.component';
import { InfoMappingCertificado } from 'src/app/models/InfoCertificados';
import moment from 'moment';
import { ComprarEnergiaComponent } from '../comprar-energia/comprar-energia.component';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { InfoContrato } from 'src/app/models/infoContrato';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { ContratarComercializadorComponent } from '../contratar-comercializador/contratar-comercializador.component';
import { AcuerdoEnergia, EstadoAcuerdo } from 'src/app/models/AcuerdoEnergia';
import { AcuerdoEnergiaComponent } from '../acuerdo-energia/acuerdo-energia.component';

import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-lista-compras',
  templateUrl: './lista-compras.component.html',
  styles: [
  ]
})
export class ListaComprasComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['empresaComercializador', 'empresaGenerador', 'estado', 'fechaInicio', 'fechaFin', 'tipoEnergia', 'energiaTotal', 'energiaEntregada']
  energiasDisponibles: string[];
  dataSource: MatTableDataSource<AcuerdoEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];
  compraEnergiaEvent: any;

  filters = {
    comercializador: '',
    generador:'',
    fechaSolicitud: '',
    fechaFin: '',
    tipoEnergia: '',
    estado: undefined
  }

  infoCliente: InfoContrato;
  nombreComercializador: string;
  nullAddress: string = '0x0000000000000000000000000000000000000000';
  actualizacionContratoEvent: any;

  constructor(private bancoEnergia: BancoEnergiaService,
    private cliente: ClienteContractService,
    private reguladorMercado: ReguladorMercadoService,
    private acuerdosLedger: AcuerdoContractService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private toastr: ToastrService,
    private tableService: TableService,
    private languageService: LanguageService

  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnDestroy(): void {
    if (this.actualizacionContratoEvent) {
      this.actualizacionContratoEvent.removeAllListeners('data');
    }
  }

  // TRACUCTOR
  private languageSubs: Subscription;
  // variables
  

  async ngOnInit(): Promise<void> {
    const dirContract = localStorage.getItem('dirContract');
    try {
      this.spinner.show();
      let promises: Promise<void>[] = [];
      this.tableService.setPaginatorTable(this.paginator);

      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.acuerdosLedger.loadBlockChainContractData());
      promises.push(this.cliente.loadBlockChainContractData(dirContract));
      await Promise.all(promises);
      this.spinner.hide();

      this.getInfoContrato();
      this.actualizacionContratoEvent = this.cliente.contract.events.actualizacionContrato({
        fromBlock: 'latest'
      }, (error: { message: string; }) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      }).on('data', () => {
        if (this.infoCliente) {
          this.ngZone.run(() => {
            this.getComprasCliente(this.infoCliente.dirContrato);
          })
        }
      })
    } catch (error) {
      this.toastr.error(error.message, 'Error');
      console.log(error);
    }
  }

  private getComprasCliente(dirContractCliente: string) {
    this.spinner.show();
    this.acuerdosLedger.getAcuerdosDeCompraByCliente(dirContractCliente).subscribe({
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

  private setFilterForm() {

    this.filterFormProperties = [{
      fields: [{
        label: 'Comercializador',
        formControlName: 'comercializador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Generador',
        formControlName: 'generador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Fecha de solicitud',
        formControlName: 'fechaSolicitud',
        controlType: 'date',
        pipe: ''
      }]
    }, {
      fields: [{
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
    if (this.infoCliente) {
      this.getComprasCliente(this.infoCliente.dirContrato);
    }
  }


  private filterData(data: AcuerdoEnergia[]): AcuerdoEnergia[] {
    let filterArray = data;

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

  verCertificado(compra: InfoCompraEnergia) {
    let requestCompra: InfoMappingCertificado = {
      dirContratoCliente: compra.dirContratoCliente,
      dirContratoGenerador: compra.dirContratoGerador,
      dirContratoComercializador: compra.dirComercializador,
      cantidadEnergia: compra.cantidadEnergia,
      tipoEnergia: compra.tipoEnergia,
      fechaCompra: compra.fechaAprobacionNumber,
    }

    this.dialog.open(InfoCertificadoCompraComponent, {
      width: '540px',
      data: requestCompra
    });
  }

  onSolicitarCompra() {
    let dialogRef = this.dialog.open(ComprarEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getInfoContrato();
      }
    })
  }

  onContratoEnergia() {

    let dialogRef = this.dialog.open(AcuerdoEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getComprasCliente(this.infoCliente.dirContrato);
      }
    });
  }

  onContratar() {
    let dialogRef = this.dialog.open(ContratarComercializadorComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        comercializador: this.infoCliente.comercializador
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.spinner.show();
      this.cliente.getInfoContrato().subscribe({
        next: (data) => {
          this.infoCliente = data;
          this.spinner.hide();
        }, error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
          this.spinner.hide();
        }
      })
    });
  }

  private getInfoContrato() {
    this.spinner.show();
    let observables: Observable<any>[] = [];
    observables.push(this.cliente.getInfoContrato());
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles())

    forkJoin(observables).subscribe({
      next: async (data) => {
        this.infoCliente = data[0];
        const tiposEnergias = data[1] as InfoEnergia[];
        this.energiasDisponibles = tiposEnergias.map(x => x.nombre);
        this.getComprasCliente(this.infoCliente.dirContrato);
        this.setFilterForm();
        this.spinner.hide();
      }, error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }

  get solicitarIsValid(): boolean {
    if (this.infoCliente) {
      return this.infoCliente.comercializador != this.nullAddress ? true : false;
    }

    return false;
  }
}
