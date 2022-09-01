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

  constructor(private bancoEnergia: BancoEnergiaService,
    private cliente: ClienteContractService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private toastr: ToastrService,
    private tableService: TableService
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
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.cliente.loadBlockChainContractData(dirContract));
      await Promise.all(promises);
      this.getEnergiasDisponibles();
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
          this.getComprasCliente()
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

        const filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
      },
      error: (err) => {

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

  private getEnergiasDisponibles() {
    this.spinner.show()
    this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
      next: (data) => {
        this.energiasDisponibles = data.map(item => item.nombre);
        this.setFilterForm();
        this.spinner.hide();
      },
      error: (error) => {
        console.log(error);
        this.spinner.hide();
        this.toastr.error(error.message, 'Error');
      }
    })
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
}
