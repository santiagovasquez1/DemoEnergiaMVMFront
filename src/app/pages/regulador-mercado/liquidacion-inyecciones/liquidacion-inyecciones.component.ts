import { LiquidarInyeccionComponent } from './../liquidar-inyeccion/liquidar-inyeccion.component';
import { InfoInyeccionBanco, EstadoInyeccion } from './../../../models/infoInyeccionBanco';
import { Observable, switchMap, map, from, reduce, forkJoin } from 'rxjs';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { TableService } from 'src/app/services/shared/table-service.service';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';

@Component({
  selector: 'app-liquidacion-inyecciones',
  templateUrl: './liquidacion-inyecciones.component.html',
  styleUrls: ['./liquidacion-inyecciones.component.css']
})
export class LiquidacionInyeccionesComponent implements OnInit {

  displayedColumns: string[] = ['generador', 'planta', 'tipoEnergia', 'cantidad', 'precio', 'estado', 'fechaInyeccion'];
  totalEnergiaInyectada: number;
  dataSource: MatTableDataSource<InfoInyeccionBanco>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;
  filterFormProperties: RowFilterForm[] = [];

  filters = {
    generador: '',
    planta: '',
    tipoEnergia: '',
    cantidad: '',
    precio: '',
    estado: undefined,
    fechaInyeccion: ''
  }

  constructor(private bancoEnergiaService: BancoEnergiaService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private tableService: TableService,
    private dialog: MatDialog) {
    this.dataSource = new MatTableDataSource();

  }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    let promises: Promise<any>[] = [];
    promises.push(this.bancoEnergiaService.loadBlockChainContractData());
    await Promise.all(promises);
    this.spinner.hide();
    this.setFilters();
    this.tableService.setPaginatorTable(this.paginator);
    this.getInfoInyeccionesEnergias();
  }

  private setFilters() {
    this.spinner.show();
    this.bancoEnergiaService.getTiposEnergiasDisponibles().subscribe({
      next: data => {
        this.filterFormProperties = [{
          fields: [{
            label: 'Generador',
            formControlName: 'generador',
            controlType: 'text',
            pipe: ''
          }, {
            label: 'Planta',
            formControlName: 'planta',
            controlType: 'text',
            pipe: ''
          }, {
            label: 'Tipo de energía',
            formControlName: 'tipoEnergia',
            controlType: 'select',
            pipe: '',
            optionValues: data.map(item => item.nombre)
          },
          {
            label: 'Cantidad (Mw)',
            formControlName: 'cantidad',
            controlType: 'number',
            pipe: ''
          }],
        }, {
          fields: [{
            label: 'Precio de venta',
            formControlName: 'precio',
            controlType: 'number',
            pipe: ''
          }, {
            label: 'Estado liquidación',
            formControlName: 'estado',
            controlType: 'select',
            pipe: 'estadoInyeccion',
            optionValues: Object.values(EstadoInyeccion).filter(item => typeof item == 'number') as EstadoInyeccion[]
          }, {
            label: 'Fecha de inyección',
            formControlName: 'fechaInyeccion',
            controlType: 'date',
            pipe: ''
          }]
        }]
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.spinner.hide();
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    })
  }

  private getInfoInyeccionesEnergias() {
    this.spinner.show();
    let infoInyeccionesObservers: Observable<any>[] = [];
    infoInyeccionesObservers.push(this.bancoEnergiaService.getInfoInyeccionesEnergias());
    infoInyeccionesObservers.push(this.bancoEnergiaService.getInfoInyeccionesEnergias().pipe(
      switchMap((data) => {
        return from(data).pipe(
          map(data => data.infoEnergia.cantidadEnergia),
          reduce((acc, curr) => acc + curr)
        )
      })
    ));

    forkJoin(infoInyeccionesObservers).subscribe({
      next: data => {
        const filterArray = this.filterData(data[0] as InfoInyeccionBanco[])
        this.dataSource.data = filterArray;
        this.dataSource.data = filterArray;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();

        this.totalEnergiaInyectada = data[1];
        this.spinner.hide();
      }, error: error => {
        console.log(error);
        this.spinner.hide();
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'estado') {
      this.filters[event.controlName] = event.data !== '' ? parseInt(event.data) : event.data
    } else if (event.controlName === 'fechaInyeccion') {
      this.filters[event.controlName] = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date'
    } else {
      this.filters[event.controlName] = event.data;
    }
    this.getInfoInyeccionesEnergias();
  }

  onLiquidarInyeccion() {
    const dialogRef = this.dialog.open(LiquidarInyeccionComponent, {
      width: '500px'
    });
    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getInfoInyeccionesEnergias()
      }
    })
  }

  private filterData(data: InfoInyeccionBanco[]): InfoInyeccionBanco[] {
    let filterArray = data;
    filterArray = this.filters.generador !== '' ? filterArray.filter(item => item.nombreGenerador.toLowerCase().includes(this.filters.generador.toLowerCase())) : filterArray;
    filterArray = this.filters.planta !== '' ? filterArray.filter(item => item.infoPlanta.nombre.toLowerCase().includes(this.filters.planta.toLowerCase())) : filterArray;
    filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.infoEnergia.nombre === this.filters.tipoEnergia) : filterArray;
    filterArray = this.filters.cantidad !== '' && this.filters.cantidad !== null ? filterArray.filter(item => item.infoEnergia.cantidadEnergia === parseInt(this.filters.cantidad)) : filterArray;
    filterArray = this.filters.precio !== '' && this.filters.precio !== null ? filterArray.filter(item => item.precioEnergia === parseInt(this.filters.precio)) : filterArray;
    filterArray = this.filters.estado !== '' && this.filters.estado !== undefined && this.filters.estado !== null ? filterArray.filter(item => item.estadoInyeccion === parseInt(this.filters.estado) as EstadoInyeccion) : filterArray;

    filterArray = this.filters.fechaInyeccion !== 'Invalid date' && this.filters.fechaInyeccion !== '' ? filterArray.filter(item => {
      let temp = moment(item.fechaInyeccion, 'DD/MM/YYYY');
      let isSame = temp.isSame(moment(this.filters.fechaInyeccion, 'DD/MM/YYYY'), 'day');
      if (isSame) {
        return true;
      } else {
        return false;
      }
    }) : filterArray;
    return filterArray;
  }
}
