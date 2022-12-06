import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { TableService } from 'src/app/services/shared/table-service.service';
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
import moment from 'moment';
import { SetAcuerdosComponent } from '../set-acuerdos/set-acuerdos.component';
import { AcuerdoContractService } from 'src/app/services/acuerdo-contract.service';
import { AcuerdoEnergia } from 'src/app/models/AcuerdoEnergia';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';

@Component({
  selector: 'app-emisiones-compra',
  templateUrl: './emisiones-compra.component.html',
  styles: [
  ]
})
export class EmisionesCompraComponent implements OnInit, OnDestroy {

  estadosCompra: EstadoCompra[];
  energiasDisponibles: string[];
  displayedColumns: string[] = ['empresaCliente', 'fechaInicio', 'fechaFin', 'tipoEnergia', 'energiaTotal', 'energiaEntregada', 'acciones']
  title: string;
  isLoading: boolean = false;
  emisionCompraEvent: any
  clientes: SolicitudContrato[];
  clientesNombre: string[] = [];

  reloadData: boolean = false;
  // dataSource: MatTableDataSource<InfoEmisionCompra>;
  dataSource: MatTableDataSource<AcuerdoEnergia>;
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
    private regulardorMercado: ReguladorMercadoService,
    private acuerdosService: AcuerdoContractService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private bancoEnergia: BancoEnergiaService,
    private tableService: TableService,
    private alertService: SweetAlertService) {
    this.dataSource = new MatTableDataSource();
  }

  private setFilterFormData() {
    this.filterFormProperties = [{
      fields: [{
        label: 'Empresa',
        formControlName: 'empresa',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Fecha de solicitud',
        formControlName: 'fechaSolicitud',
        controlType: 'date',
        pipe: ''
      }, {
        label: 'Fecha de compra',
        formControlName: 'fechaCompra',
        controlType: 'date',
        pipe: ''
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
        optionValues: Object.values(EstadoCompra).filter(item=>typeof item == 'number'),
        pipe: 'estadoCompra'
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
      promises.push(this.acuerdosService.loadBlockChainContractData());
      await Promise.all(promises);
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.show()
      this.onGetAcuerdos();
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
          // this.toastr.success('Emisión de compra registrada', 'Éxito');
        });
      });

      this.getEmisionesDeCompra();
    } catch (error) {
      console.log(error);
      // this.toastr.error("Error al cargar el contrato comercializador", 'Error');
    }
  }


  private getEmisionesDeCompra() {
    // this.comercializadorService.getEmisionesDeCompra().subscribe({
    //   next: (emisiones) => {
    //     const filterData = this.filterData(emisiones);
    //     this.dataSource.data = filterData;
    //     this.dataSource.paginator = this.paginator;
    //     this.dataSource.sort = this.sort;
    //     this.table.renderRows();

    //   }, error: (err) => {
    //     console.log(err);
    //     this.toastr.error(err.message, 'Error');
    //   }
    // });
  }

  public onRealizarCompra(emisionCompra: AcuerdoEnergia) {
    console.log("EMISION: ",emisionCompra)
    let dialogRef = this.dialog.open(SetAcuerdosComponent, {
      width: '500px',
      data: {
        emision: emisionCompra,
        
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        // this.getInfoContrato();
      }
    })

    // let dialog = this.dialog.open(CompraEnergiaComponent, {
    //   width: '610px',
    //   data: {
    //     emision: emisionCompra,
    //     index: index,
    //     dirContract: localStorage.getItem('dirContract')
    //   }
    // });

    // dialog.afterClosed().subscribe(result => {
    //   this.getEmisionesDeCompra();
    // });
  }

  public onRechazarCompra(dirContrato: string, index: number) {

    this.alertService.confirmAlert('Rechazar', '¿Desea rechazar la solicitud de compra?')
      .then(result => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.comercializadorService.rechazarCompra(dirContrato, index).subscribe({
            next: () => {
              this.toastr.info('Solicitud rechazada', 'Info');
              this.spinner.hide();
              this.getEmisionesDeCompra();
            },
            error: (error) => {
              console.log(error);
              this.spinner.hide();
              this.toastr.error(error.message, 'Error');
            }
          })
        }
      })
  }

  onAcuerdoCompra(){
    // let _dirGenerador: string = '0x26cd32E0Ef557d88e89CB841C1b58d6623Cd42BD';
    // let _dirCliente: string = '0x19340ba17d7E375c37C36Bf349835FE930E329F8';
    // let _indexGlobal: number = 0;

    // this.comercializadorService.realizarAcuerdo(_dirGenerador, _dirCliente,_indexGlobal).subscribe({
    //   next: (data) => {
    //     console.log("DATA: ",data)
    //     this.toastr.success("realizado","exito");
    //     this.spinner.hide();
    //   }, error: (error) => {
    //     console.log(error);
    //     this.toastr.error(error.message, 'Error');
    //     this.spinner.hide();
    //   }
    // });
    let dialogRef = this.dialog.open(SetAcuerdosComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        // this.getInfoContrato();
      }
    })
  }

  onGetAcuerdos(){
    this.getInfoClientes()

    this.acuerdosService.getAcuerdosDeCompraMercado().subscribe({
      next: (data: any) => {

        const fechaFin = data.map((valor) => new Date(valor.fechaFin *1000).toLocaleDateString('en-GB') );
        const fechaSolicitud = data.map((valor) => new Date(valor.fechaSolicitud *1000).toLocaleDateString('en-GB') );

        let array: any[] = [];
        for (let index = 0; index < data.length; index++) {
          array.push({
            dirCliente: data[index].dirCliente,
            nombre: this.clientesNombre[index],
            dirGenerador: data[index].dirGenerador,
            dirComercializador: data[index].dirComercializador,
            tipoEnergia: data[index].tipoEnergia,
            cantidadEnergiaTotal: data[index].cantidadEnergiaTotal,
            cantidadEnergiaInyectada: data[index].cantidadEnergiaInyectada,
            fechaSolicitud: fechaSolicitud[index],
            fechaInicio: data[index].fechaInicio,
            fechaFin: fechaFin[index],
            estadoAcuerdo: data[index].estadoAcuerdo,
            indexCliente: data[index].indexCliente,
            indexGlobal: data[index].indexGlobal
          })
        }

        // data[0].fechaFin = date.toDateString();
        console.log("DATA historico: ",data)
        this.dataSource.data = array;
        // this.dataSource.data[0].fechaFin = date.toDateString();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
        // console.log("DATA historico: ",data[0].cantidadEnergiaInyectada)
        // console.log("DATA historico: ",data[0].dirComercializador)
        this.toastr.success("El cuerdo se ha concretado con el generador.","Transacción exitosa!");
        this.spinner.hide();
      }, error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }

  private getInfoClientes() {
    console.log("DATA DESDE GETINFOCLIENTES: ",this.dataSource.data)
    this.regulardorMercado.getSolicitudesRegistro().subscribe({
      next: (data) => {
        let filterData = data as SolicitudContrato[];
        this.clientes = filterData.filter(item => item.tipoContrato == 0);
        console.log("FILTRO CLIENTES: ",this.clientes)
        let cliente: string = '';
        for (let i = 0; i < this.clientes.length; i++) {
          cliente = this.clientes[i].infoContrato.empresa;
          console.log("del for: ",cliente)
          this.clientesNombre.push(cliente)
          console.log("VECTOR CLIENTES NOMBRE: ",this.clientesNombre)
        }
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    });
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'fechaCompra' || event.controlName === 'fechaSolicitud') {
      if (event.controlName == 'fechaCompra') {
        this.filters.fechaCompra = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
      } else {
        this.filters.fechaSolicitud = event.data !== '' ? moment(event.data).format('DD/MM/YYYY') : 'Invalid date';
      }
    } else if (event.controlName === 'estado') {
      this.filters.estado = event.data !== '' ? parseInt(event.data) : '';
    } else {
      this.filters[event.controlName] = event.data
    }
    this.getEmisionesDeCompra();
  }

  private filterData(data: AcuerdoEnergia[]): AcuerdoEnergia[] {
    let filterArray = data;
    // filterArray = this.filters.empresa !== '' ? filterArray.filter(item => item.empresaCliente.toLowerCase().includes(this.filters.empresa)) : filterArray;
    // filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.tipoEnergia.toLowerCase().includes(this.filters.tipoEnergia)) : filterArray;
    // filterArray = this.filters.fechaSolicitud !== 'Invalid date' && this.filters.fechaSolicitud !== '' ? filterArray.filter(item => {
    //   let temp = moment(item.fechaEmision, 'DD/MM/YYYY');
    //   let isSame = temp.isSame(moment(this.filters.fechaSolicitud, 'DD/MM/YYYY'), 'day');
    //   if (isSame) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }) : filterArray;
    // filterArray = this.filters.fechaCompra !== 'Invalid date' && this.filters.fechaCompra !== '' ? filterArray.filter(item => {
    //   let temp = moment(item.fechaAprobacion, 'DD/MM/YYYY');
    //   let isSame = temp.isSame(moment(this.filters.fechaCompra, 'DD/MM/YYYY'), 'day');
    //   if (isSame) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }) : filterArray;
    // filterArray = this.filters.estado !== undefined && this.filters.estado !== '' ? filterArray.filter(item => item.estado == this.filters.estado) : filterArray;
    // filterArray = this.filters.tipoEnergia !== '' ? filterArray.filter(item => item.tipoEnergia == this.filters.tipoEnergia) : filterArray;
    return filterArray;
  }
}
