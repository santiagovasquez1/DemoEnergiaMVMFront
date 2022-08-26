import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { EnumTipoEmision } from './../../../models/EnumTipoEmision';
import { ActivatedRoute, Router } from '@angular/router';
import { CompraEnergiaComponent } from './../compra-energia/compra-energia.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { EstadoCompra, InfoEmisionCompra } from './../../../models/InfoEmisionCompra';
import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { filter, Observable, Subscription } from 'rxjs';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { CompraEnergiaRequest } from 'src/app/models/CompraEnergiaRequest';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';

@Component({
  selector: 'app-emisiones-compra',
  templateUrl: './emisiones-compra.component.html',
  styles: [
  ]
})
export class EmisionesCompraComponent implements OnInit, OnDestroy {

  energiasDisponibles: string[];
  displayedColumns: string[] = ['empresaCliente', 'fechaEmision', 'fechaAprobacion', 'tipoEnergia', 'cantidadEnergia', 'estado', 'acciones']
  title: string;
  isLoading: boolean = false;
  emisionCompraEvent: any

  reloadData: boolean = false;
  dataSource: MatTableDataSource<InfoEmisionCompra>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];
  
  filters = {
    empresa: '',
    fechaSolicitud: '',
    fechaCompra: '',
    tipoEnergia: '',
    estado: undefined
  }

  constructor(private comercializadorService: ComercializadorContractService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private bancoEnergia: BancoEnergiaService) {
      this.dataSource = new MatTableDataSource();
  }

  private setFilterFormData() {
    this.filterFormProperties = [{
      fields: [{
        label: 'Empresa',
        formControlName: 'empresa',
        controlType: 'input',
        pipe: ''
      }, {
        label: 'Fecha de solicitud',
        formControlName: 'fechaSolicitud',
        controlType: 'datePicker',
        pipe: '',
        pickerIndex: 0
      }, {
        label: 'Fecha de compra',
        formControlName: 'fechaCompra',
        controlType: 'datePicker',
        pipe: '',
        pickerIndex: 1
      }]
    }, {
      fields: [{
        label: 'Tipo de energia',
        formControlName: 'tipoEnergia',
        controlType: 'select',
        optionValues: this.energiasDisponibles,
        pipe: ''
      }, {
        label: 'Estado de compra',
        formControlName: 'estado',
        controlType: 'select',
        optionValues: [],
        pipe: 'estadoRegistro'
      }]
    }];
  }

  ngOnDestroy(): void {
    this.emisionCompraEvent.removeAllListeners('data');
  }

  async ngOnInit(): Promise<void> {

    let dirContract = localStorage.getItem('dirContract');
    try {
      let promises: Promise<void>[] = []
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.comercializadorService.loadBlockChainContractData(dirContract));
      await Promise.all(promises);

      this.spinner.show()
      this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
        next: (data) => {
          this.energiasDisponibles = data.map(item => item.nombre);
          this.setFilterFormData();
          this.spinner.hide();
        }, error: (error) => {
          this.spinner.hide();
          console.log(error);
          this.toastr.error(error.message, 'Error')
        }
      })

      this.emisionCompraEvent = this.comercializadorService.contract.events.EmisionDeCompra({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getEmisionesDeCompra();
          this.toastr.success('Emisión de compra registrada', 'Éxito');
        });
      });

      this.getEmisionesDeCompra();
    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar el contrato comercializador", 'Error');
    }
  }


  private getEmisionesDeCompra() {
    this.comercializadorService.getEmisionesDeCompra().subscribe({
      next: (emisiones) => {
        const filterData = this.filterData(emisiones);
        this.dataSource.data = filterData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();

      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    });
  }

  public onRealizarCompra(emisionCompra: InfoEmisionCompra, index: number) {
    let dialog = this.dialog.open(CompraEnergiaComponent, {
      width: '800px',
      data: {
        emision: emisionCompra,
        index: index,
        dirContract: localStorage.getItem('dirContract')
      }
    });

    dialog.afterClosed().subscribe(result => {
      this.getEmisionesDeCompra();
    });
  }

  onfieldValueChange(event: FieldValueChange) {

  }

  private filterData(data: InfoEmisionCompra[]): InfoEmisionCompra[] {
    let filterArray = data;

    filterArray = this.filters.empresa !== '' ? filterArray.filter(item => item.empresaCliente.toLowerCase().includes(this.filters.empresa)) : filterArray;
    filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.tipoEnergia.toLowerCase().includes(this.filters.tipoEnergia)) : filterArray;

    return filterArray;
  }
}
