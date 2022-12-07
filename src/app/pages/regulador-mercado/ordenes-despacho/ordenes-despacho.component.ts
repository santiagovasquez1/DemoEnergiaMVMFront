import { InfoGeneradorDespacho } from './../../../models/InfoGeneradorDespacho';
import { EstadoSolicitud } from './../../../models/solicitudContrato';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { InfoContrato } from './../../../models/infoContrato';
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer, switchMap, of } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { ClienteFactoryService } from 'src/app/services/cliente-factory.service';
import { ComercializadorFactoryService } from 'src/app/services/comercializador-factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';


@Component({
  selector: 'app-ordenes-despacho',
  templateUrl: './ordenes-despacho.component.html',
  styleUrls: ['./ordenes-despacho.component.css']
})
export class OrdenesDespachoComponent implements OnInit {

  estadosSolicitud: EstadoSolicitud[];
  tiposDeAgentes: TiposContratos[];

  displayedColumns: string[] = ['generador', 'ubicacion', 'capacidadNominal', 'despacho', 'acciones'];
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;
  diligenciandoSolicitud: boolean = false;
  reloadData: boolean = false;
  cantidadDespacho: number = 0;

  dataSource: MatTableDataSource<InfoGeneradorDespacho>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;
  contratoDiligenciadoEvent: any;
  filterFormProperties: RowFilterForm[] = [];

  //Filtros:
  filters = {
    nombreGenerador: '',
    contacto: '',
    ubicacion: '',
    capacidadNominal: '',
  }


  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private tableService: TableService,
    private spinner: NgxSpinnerService,
    private sweetAlert: SweetAlertService,
    private ngZone: NgZone) {
    this.dataSource = new MatTableDataSource();

    this.filterFormProperties = [{
      fields: [{
        label: 'Generador',
        formControlName: 'nombreGenerador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Contacto',
        formControlName: 'contacto',
        controlType: 'text',
        pipe: ''
      },
      {
        label: 'Ubicación',
        formControlName: 'ubicacion',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'capacidadNominal',
        formControlName: 'capacidadNominal',
        controlType: 'number',
        pipe: ''
      }]
    }]
  }

  ngOnDestroy(): void {
    this.contratoDiligenciadoEvent.removeAllListeners('data');
  }

  async ngOnInit(): Promise<void> {
    try {
      this.isFromInit = true;
      this.spinner.show();
      await this.regulardorMercado.loadBlockChainContractData();
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.hide();
      this.getGeneradores();

      this.contratoDiligenciadoEvent = this.regulardorMercado.contract.events.ContratoDiligenciado({
        fromBlock: 'latest'
      }, (err, event) => {
        if (err) {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      }).on('data', (event) => {
        this.ngZone.run(() => {
          this.getGeneradores()
        })
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  private getGeneradores() {
    this.regulardorMercado.getSolicitudesRegistro().pipe(
      switchMap(solicitudes => {
        return of(solicitudes.filter(item => item.tipoContrato == TiposContratos.Generador).map(solicitud => {
          let infoGeneradorDespacho: InfoGeneradorDespacho = {
            nombreGenerador: solicitud.infoContrato.empresa,
            contacto: solicitud.infoContrato.contacto,
            ubicacion: `${solicitud.infoContrato.departamento} - ${solicitud.infoContrato.ciudad}`,
            capacidadNominalGenerador: 0
          };
          return infoGeneradorDespacho
        }));
      })
    ).subscribe({
      next: data => {
        let filterData = this.filterData(data);
        this.dataSource.data = filterData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    })
  }

  onKey(event: any) {
    this.cantidadDespacho = event.target.value;
    console.log(this.cantidadDespacho)
  }

  onApprove(index: number, solicitud: SolicitudContrato) {
    // this.diligenciandoSolicitud = true;
    // console.log("SOLICITUD: ", solicitud)
    // this.sweetAlert.confirmAlert('Diligenciar solicitud', '¿Está seguro de diligenciar la solicitud?')
    //   .then(async (result) => {
    //     if (result.isConfirmed) {
    //       this.spinner.show();
    //       switch (solicitud.tipoContrato) {
    //         case TiposContratos.Generador:
    //           await this.generadorFactory.loadBlockChainContractData();
    //           let dirGenerador = solicitud.infoContrato.dirContrato;
    //           this.regulardorMercado.setDespachoEnergia(dirGenerador, this.cantidadDespacho).subscribe({
    //             next: () => {
    //               this.spinner.hide();
    //               this.toastr.success('Solicitud diligenciada', 'Registro');
    //               this.reloadData = true;
    //               this.diligenciandoSolicitud = false;
    //             }, error: (err) => {
    //               this.diligenciandoSolicitud = false;
    //               console.log(err);
    //               this.spinner.hide();
    //               this.toastr.error(err.message, 'Error');
    //             }
    //           });

    //           this.regulardorMercado.getDespachosRealizados().subscribe({
    //             next: (data) => {
    //               console.log("data de despachos: ", data)
    //             }, error: (err) => {
    //               console.log(err);
    //             }
    //           });
    //           break;
    //         default:
    //           this.spinner.hide();
    //           this.toastr.error('Tipo de contrato no soportado', 'Error');
    //       }

    //     } else {
    //       this.diligenciandoSolicitud = false;
    //     }
    //   })
  }


  onfieldValueChange(event: FieldValueChange) {
    this.filters[event.controlName] = event.data
    this.getGeneradores();
  }

  private filterData(data: InfoGeneradorDespacho[]): InfoGeneradorDespacho[] {
    let filterArray = data
    filterArray = this.filters.nombreGenerador !== '' ? filterArray.filter(item => item.nombreGenerador.toLowerCase().includes(this.filters.nombreGenerador)) : filterArray;
    filterArray = this.filters.contacto !== '' ? filterArray.filter(item => item.contacto.toLowerCase().includes(this.filters.contacto.toLowerCase())) : filterArray;
    filterArray = this.filters.ubicacion !== '' ? filterArray.filter(item => item.ubicacion.toLowerCase().includes(this.filters.ubicacion.toLowerCase())) : filterArray;
    filterArray = this.filters.capacidadNominal !== '' ? filterArray.filter(item => item.capacidadNominalGenerador == parseInt(this.filters.capacidadNominal)) : filterArray;
    return filterArray;
  }

}
