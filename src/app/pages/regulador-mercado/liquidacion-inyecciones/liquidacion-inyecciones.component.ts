import { LiquidarInyeccionComponent } from './../liquidar-inyeccion/liquidar-inyeccion.component';
import { InfoInyeccionBanco } from './../../../models/infoInyeccionBanco';
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
    fechaInyeccion: ''
  }

  constructor(private bancoEnergiaService: BancoEnergiaService,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private tableService: TableService,
    private dialog: MatDialog) {
    this.dataSource = new MatTableDataSource();
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
        optionValues: []
      }],
    }, {
      fields: [{
        label: 'Cantidad (Mw)',
        formControlName: 'cantidad',
        controlType: 'number',
        pipe: ''
      }, {
        label: 'Precio de venta',
        formControlName: 'precio',
        controlType: 'number',
        pipe: ''
      }, {
        label: 'Fecha de inyección',
        formControlName: 'fechaInyeccion',
        controlType: 'date',
        pipe: ''
      }]
    }]
  }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    let promises: Promise<any>[] = [];
    promises.push(this.bancoEnergiaService.loadBlockChainContractData());
    await Promise.all(promises);
    this.spinner.hide();
    this.tableService.setPaginatorTable(this.paginator);
    this.getInfoInyeccionesEnergias();
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
        const filterData = data[0] as InfoInyeccionBanco[]
        this.dataSource.data = filterData;
        this.dataSource.data = filterData;
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
}
