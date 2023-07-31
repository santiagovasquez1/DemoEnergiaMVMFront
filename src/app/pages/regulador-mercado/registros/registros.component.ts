import { EstadoSolicitud } from './../../../models/solicitudContrato';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { InfoContrato } from './../../../models/infoContrato';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer, filter } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { ClienteFactoryService } from 'src/app/services/cliente-factory.service';
import { ComercializadorFactoryService } from 'src/app/services/comercializador-factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { forkJoin } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-registros',
  templateUrl: './registros.component.html',
  styles: [
  ]
})
export class RegistrosComponent implements OnInit, OnDestroy {
  // TRADUCCION
  private languageSubs: Subscription;
  // variables modales
  titleAprove: string;
  labelAprove: string;
  titleReject: string;
  labelReject: string;
  // variables toasts
  titleToastDiligence: string;
  labelToastDiligence: string;
  titleToastTypeContractError: string;
  labelToastTypeContractError: string;
  titleToastReject: string;
  titleTastNewApplication: string;

  estadosSolicitud: EstadoSolicitud[];
  tiposDeAgentes: TiposContratos[];

  displayedColumns: string[] = ['empresa', 'contacto', 'ubicacion', 'correo', 'tipoAgente', 'estado', 'acciones'];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;
  diligenciandoSolicitud: boolean = false;
  reloadData: boolean = false;

  dataSource: MatTableDataSource<SolicitudContrato>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;

  filterFormProperties: RowFilterForm[] = [];

  //Filtros:
  filters = {
    empresa: '',
    contacto: '',
    ubicacion: '',
    correo: '',
    tipoAgente: undefined,
    estado: undefined
  }


  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private tableService: TableService,
    private spinner: NgxSpinnerService,
    private sweetAlert: SweetAlertService,
    private clienteFactory: ClienteFactoryService,
    private comercializadorFactory: ComercializadorFactoryService,
    private generadorFactory: GeneradorFactoryService,
    private fb: FormBuilder,
    private languageService: LanguageService) {
    this.timer$ = timer(0, 5000);
    this.dataSource = new MatTableDataSource();
    this.getArraysEnums();

    this.filterFormProperties = [{
      fields: [{
        label: 'Empresa',
        formControlName: 'empresa',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Contacto',
        formControlName: 'contacto',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Correo',
        formControlName: 'correo',
        controlType: 'text',
        pipe: ''
      }]
    }, {
      fields: [{
        label: 'Ubicación',
        formControlName: 'ubicacion',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Tipo de agente',
        formControlName: 'tipoAgente',
        controlType: 'select',
        optionValues: this.tiposDeAgentes,
        pipe: 'tipoContrato'
      }, {
        label: 'Estado',
        formControlName: 'estado',
        controlType: 'select',
        optionValues: this.estadosSolicitud,
        pipe: 'estadoRegistro'
      }]
    }]
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  initializeTranslations(): void {
    forkJoin([
      this.languageService.get('Diligenciar solicitud'),
      this.languageService.get('¿Está seguro de diligenciar la solicitud?'),
      this.languageService.get('Rechazar solicitud'),
      this.languageService.get('¿Está seguro de rechazar la solicitud?'),
      this.languageService.get('Solicitud diligenciada'),
      this.languageService.get('Registro'),
      this.languageService.get('Tipo de contrato no soportado'),
      this.languageService.get('Error'),
      this.languageService.get('Solicitud rechazada'),
      this.languageService.get('Nueva solicitud registrada')
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.titleAprove = translatedTexts[0];
        this.labelAprove = translatedTexts[1];
        this.titleReject = translatedTexts[2];
        this.labelReject = translatedTexts[3];
        this.titleToastDiligence = translatedTexts[4];
        this.labelToastDiligence = translatedTexts[5];
        this.titleToastTypeContractError = translatedTexts[6];
        this.titleToastReject = translatedTexts[7];
        this.titleTastNewApplication = translatedTexts[8];
      },
      error: err => {
        console.log(err);
      }
    })
  }

  async ngOnInit(): Promise<void> {
    try {
      this.languageSubs = this.languageService.language.subscribe({
        next: language => {
          this.initializeTranslations();
          console.log('language: ', language);
        },
        error: err => {
          console.log(err);
        }
      });

      this.isFromInit = true;
      this.spinner.show();
      await this.regulardorMercado.loadBlockChainContractData();
      this.tableService.setPaginatorTable(this.paginator);
      this.spinner.hide();
      this.timerSubscription = this.timer$.subscribe(() => {
        this.getInfoAgentes();
      });
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, this.titleToastTypeContractError);
    }
  }

  private getInfoAgentes() {
    this.regulardorMercado.getSolicitudesRegistro().subscribe({
      next: (data) => {
        const filterData = this.filterData(data);

        this.contadorActual = filterData.length;
        if ((this.contadorActual !== this.contadorAnterior && !this.diligenciandoSolicitud) || this.reloadData) {
          this.dataSource.data = filterData;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          if (this.contadorActual > this.contadorAnterior && !this.isFromInit) {
            this.toastr.success(this.titleTastNewApplication, this.labelToastDiligence);
          }
          this.reloadData = false;
          this.table.renderRows();
          this.contadorAnterior = this.contadorActual;
        }
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, this.titleToastTypeContractError);
      }
    });
  }

  onApprove(index: number, solicitud: SolicitudContrato) {
    this.diligenciandoSolicitud = true;
    this.sweetAlert.confirmAlert(this.titleAprove, this.labelAprove)
      .then(async (result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          switch (solicitud.tipoContrato) {
            case TiposContratos.Cliente:
              await this.clienteFactory.loadBlockChainContractData();
              this.clienteFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success(this.titleToastDiligence, this.labelToastDiligence);
                  this.reloadData = true;
                  this.diligenciandoSolicitud = false;
                  this.getInfoAgentes();
                }, error: (err) => {
                  this.diligenciandoSolicitud = false;
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, this.titleToastTypeContractError);
                }
              });
              break;
            case TiposContratos.Comercializador:
              await this.comercializadorFactory.loadBlockChainContractData();
              this.comercializadorFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success(this.titleToastDiligence, this.labelToastDiligence);
                  this.reloadData = true;
                  this.diligenciandoSolicitud = false;
                  this.getInfoAgentes();
                }, error: (err) => {
                  this.diligenciandoSolicitud = false;
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, this.titleToastTypeContractError);
                }
              });
              break;
            case TiposContratos.Generador:
              await this.generadorFactory.loadBlockChainContractData();

              this.generadorFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success(this.titleToastDiligence, this.labelToastDiligence);
                  this.reloadData = true;
                  this.diligenciandoSolicitud = false;
                  this.getInfoAgentes();
                }, error: (err) => {
                  this.diligenciandoSolicitud = false;
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, this.titleToastTypeContractError);
                }
              });
              break;
            default:
              this.spinner.hide();
              this.toastr.error(this.labelToastDiligence, this.titleToastTypeContractError);
          }

        } else {
          this.diligenciandoSolicitud = false;
        }
      })

  }

  onReject(index: number, infoContrato: InfoContrato) {
    this.diligenciandoSolicitud = true;
    this.sweetAlert.confirmAlert(this.titleReject, this.labelReject)
      .then(result => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.regulardorMercado.diligenciarSolicitud(index, infoContrato, EstadoSolicitud.rechazada).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.info(this.titleToastReject, this.labelToastDiligence);
              this.reloadData = true;
              this.diligenciandoSolicitud = false;
              this.getInfoAgentes();
            },
            error: (err) => {
              this.diligenciandoSolicitud = false;
              console.log(err);
              this.spinner.hide();
              this.toastr.error(err.message, this.titleToastTypeContractError);
            }
          })
        } else {
          this.diligenciandoSolicitud = false;
        }
      })
  }

  onfieldValueChange(event: FieldValueChange) {
    if (event.controlName === 'tipoAgente' || event.controlName === 'estado') {
      this.filters[event.controlName] = event.data !== '' ? parseInt(event.data) : event.data;
    } else {
      this.filters[event.controlName] = event.data;
    }
    this.reloadData = true;
    this.getInfoAgentes();
  }

  private getArraysEnums() {
    this.tiposDeAgentes = Object.values(TiposContratos).filter(item => typeof item === 'number') as TiposContratos[];
    this.estadosSolicitud = Object.values(EstadoSolicitud).filter(item => typeof item === 'number') as EstadoSolicitud[];
  }

  private filterData(data: SolicitudContrato[]): SolicitudContrato[] {
    let filterArray = data
    filterArray = this.filters.empresa !== '' ? filterArray.filter(item => item.infoContrato.empresa.toLowerCase().includes(this.filters.empresa)) : filterArray;
    filterArray = this.filters.contacto !== '' ? filterArray.filter(item => item.infoContrato.contacto.toLowerCase().includes(this.filters.contacto.toLowerCase())) : filterArray;
    filterArray = this.filters.ubicacion !== '' ? filterArray.filter(item => item.infoContrato.departamento.toLowerCase().includes(this.filters.ubicacion.toLowerCase())) : filterArray;
    filterArray = this.filters.correo !== '' ? filterArray.filter(item => item.infoContrato.correo.toLowerCase().includes(this.filters.correo.toLowerCase())) : filterArray;
    filterArray = this.filters.tipoAgente !== '' && this.filters.tipoAgente !== undefined ? filterArray.filter(item => item.tipoContrato == this.filters.tipoAgente) : filterArray;
    filterArray = this.filters.estado !== '' && this.filters.estado !== undefined ? filterArray.filter(item => item.estadoSolicitud == this.filters.estado) : filterArray;

    return filterArray;
  }
}
