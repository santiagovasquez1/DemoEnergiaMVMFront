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
import { forkJoin, Observable } from 'rxjs';
import { InfoContrato } from 'src/app/models/infoContrato';
import { InfoEnergia } from 'src/app/models/InfoEnergia';

@Component({
  selector: 'app-lista-compras',
  templateUrl: './lista-compras.component.html',
  styles: [
  ]
})
export class ListaComprasComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['id', 'comercializador', 'cantidad', 'tecnologia', 'fechaCompra', 'valorCompra', 'generador', 'planta', 'certificado'];
  energiasDisponibles: string[];
  dataSource: MatTableDataSource<InfoCompraEnergia>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];
  compraEnergiaEvent: any;

  filters = {
    tecnologia: '',
    fechaCompra: '',
    generador: '',
    planta: ''
  }

  tokensDelegados: number = 0;
  infoCliente: InfoContrato;

  constructor(private bancoEnergia: BancoEnergiaService,
    private cliente: ClienteContractService,
    private reguladorMercado: ReguladorMercadoService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private toastr: ToastrService,
    private tableService: TableService,

  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnDestroy(): void {
    this.compraEnergiaEvent.removeAllListeners();
  }

  async ngOnInit(): Promise<void> {
    const dirContract = localStorage.getItem('dirContract');
    try {
      let promises: Promise<void>[] = [];
      this.tableService.setPaginatorTable(this.paginator);

      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.cliente.loadBlockChainContractData(dirContract));
      await Promise.all(promises);

      this.getInfoContrato();
      this.compraEnergiaEvent = this.cliente.contract.events.compraEnergia({
        fromBlock: 'latest'
      }, (error, data) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      }).on('data', () => {
        this.ngZone.run(() => {
          this.toastr.success('Compra de energía realizada', 'Energía');
          this.getComprasCliente();
          this.getInfoContrato();
        });
      });
      this.getComprasCliente();
    } catch (error) {
      this.toastr.error(error.message, 'Error');
      console.log(error);
    }
  }

  private getComprasCliente() {
    this.cliente.getComprasRealizadas().subscribe({
      next: (data) => {
        debugger;
        const filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
      },
      error: (err) => {
        debugger;
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    })
  }

  private setFilterForm() {
    this.filterFormProperties = [{
      fields: [{
        label: 'Tecnologia',
        formControlName: 'tecnologia',
        controlType: 'select',
        pipe: '',
        optionValues: this.energiasDisponibles
      }, {
        label: 'Fecha de compra',
        formControlName: 'fechaCompra',
        controlType: 'date',
        pipe: ''
      }, {
        label: 'Generador',
        formControlName: 'generador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Planta',
        formControlName: 'planta',
        controlType: 'text',
        pipe: ''
      }]
    }]
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'fechaCompra') {
      this.filters.fechaCompra = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
    } else {
      this.filters[event.controlName] = event.data;
    }
    this.getComprasCliente();
  }


  private filterData(data: InfoCompraEnergia[]): InfoCompraEnergia[] {
    let filterArray = data;
    filterArray = this.filters.fechaCompra !== 'Invalid date' && this.filters.fechaCompra !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaAprobacion, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaCompra, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;

    filterArray = this.filters.generador !== '' ? filterArray.filter(item => item.empresaGerador.toLocaleLowerCase().includes(this.filters.generador.toLowerCase())) : filterArray;
    filterArray = this.filters.planta !== '' ? filterArray.filter(item => item.nombrePlanta.toLocaleLowerCase().includes(this.filters.planta)) : filterArray;
    filterArray = this.filters.tecnologia !== '' ? filterArray.filter(item => item.tipoEnergia == this.filters.tecnologia) : filterArray;

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
      width: '800px',
      data: requestCompra
    });
  }

  onSolicitarCompra() {
    let dialogRef = this.dialog.open(ComprarEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        tokensDelegados: this.tokensDelegados
      }
    });
  }

  private getInfoContrato() {
    let observables: Observable<any>[] = [];
    observables.push(this.cliente.getInfoContrato());
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles())

    forkJoin(observables).subscribe({
      next: (data) => {
        this.infoCliente = data[0];
        const tiposEnergias = data[1] as InfoEnergia[];
        this.energiasDisponibles = tiposEnergias.map(x => x.nombre);
        if (this.infoCliente.comercializador !== '0x0000000000000000000000000000000000000000') {
          this.cliente.getTokensDelegados().subscribe({
            next: (data) => {
              this.tokensDelegados = data;
              this.setFilterForm();
            },
            error: (error) => {
              this.toastr.error(error.message, 'Error');
              console.log(error);
            }
          })
        }
      }, error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }
}