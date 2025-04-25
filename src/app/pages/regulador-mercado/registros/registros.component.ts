import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { timer, Subject, forkJoin, from, EMPTY } from 'rxjs';
import {
  switchMap,
  tap,
  catchError,
  finalize,
  takeUntil,
  startWith,
  withLatestFrom,
  map,
} from 'rxjs/operators';

import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { EstadoSolicitud, SolicitudContrato } from 'src/app/models/solicitudContrato';
import { InfoContrato } from 'src/app/models/infoContrato';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';

import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { ClienteFactoryService } from 'src/app/services/cliente-factory.service';
import { ComercializadorFactoryService } from 'src/app/services/comercializador-factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { LanguageService } from 'src/app/services/language.service';

interface FactoryService {
  loadBlockChainContractData(): Promise<any>;
  setFactoryContrato(info: InfoContrato): import('rxjs').Observable<any>;
}

@Component({
  selector: 'app-registros',
  templateUrl: './registros.component.html',
  styles: [],
})
export class RegistrosComponent implements OnInit, OnDestroy {
  // material table
  displayedColumns = [
    'empresa',
    'contacto',
    'ubicacion',
    'correo',
    'tipoAgente',
    'estado',
    'acciones',
  ];
  dataSource = new MatTableDataSource<SolicitudContrato>();
  @ViewChild('paginator', { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @ViewChild('table', { static: true }) table!: MatTable<any>;

  // filtros reactivos
  filterForm: FormGroup;
  filterFormProperties: RowFilterForm[];

  // traducciones
  titleAprove!: string;
  labelAprove!: string;
  titleReject!: string;
  labelReject!: string;
  titleToastDiligence!: string;
  labelToastDiligence!: string;
  titleToastTypeContractError!: string;
  titleToastReject!: string;
  titleTastNewApplication!: string;

  // estado interno
  private contadorAnterior = 0;
  private isInitialLoad = true;
  diligenciandoSolicitud = false;

  // para limpiar subscripciones
  private readonly destroy$ = new Subject<void>();

  // mapa dinámico de factories
  private readonly factoryMap: Partial<Record<TiposContratos, FactoryService>>;

  constructor(
    private readonly regulador: ReguladorMercadoService,
    private readonly clienteFactory: ClienteFactoryService,
    private readonly comercializadorFactory: ComercializadorFactoryService,
    private readonly generadorFactory: GeneradorFactoryService,
    private readonly tableService: TableService,
    private readonly spinner: NgxSpinnerService,
    private readonly toastr: ToastrService,
    private readonly alertDialog: SweetAlertService,
    private readonly fb: FormBuilder,
    private readonly languageService: LanguageService
  ) {
    // inicializar formulario de filtros
    this.filterForm = this.fb.group({
      empresa: [''],
      contacto: [''],
      ubicacion: [''],
      correo: [''],
      tipoAgente: [undefined],
      estado: [undefined],
    });

    this.filterFormProperties = [
      {
        fields: [
          { label: 'Empresa', formControlName: 'empresa', controlType: 'text', pipe: '' },
          { label: 'Contacto', formControlName: 'contacto', controlType: 'text', pipe: '' },
          { label: 'Correo', formControlName: 'correo', controlType: 'text', pipe: '' },
        ],
      },
      {
        fields: [
          { label: 'Ubicación', formControlName: 'ubicacion', controlType: 'text', pipe: '' },
          {
            label: 'Tipo de agente',
            formControlName: 'tipoAgente',
            controlType: 'select',
            optionValues: Object.values(TiposContratos).filter((v) => typeof v === 'number'),
            pipe: 'tipoContrato',
          },
          {
            label: 'Estado',
            formControlName: 'estado',
            controlType: 'select',
            optionValues: Object.values(EstadoSolicitud).filter((v) => typeof v === 'number'),
            pipe: 'estadoRegistro',
          },
        ],
      },
    ];

    // factories
    this.factoryMap = {
      [TiposContratos.Cliente]: this.clienteFactory,
      [TiposContratos.Comercializador]: this.comercializadorFactory,
      [TiposContratos.Generador]: this.generadorFactory,
    };
  }

  ngOnInit(): void {
    // 1) traducciones reactivas
    this.languageService.language
      .pipe(
        tap(() => this.loadTranslations()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // 2) configuramos paginador y sort
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.tableService.setPaginatorTable(this.paginator);

    // 3) carga inicial de contrato + polling + filtrado
    this.spinner.show();
    from(this.regulador.loadBlockChainContractData())
      .pipe(
        finalize(() => this.spinner.hide()),
        switchMap(() => timer(0, 5000)),
        // combinamos cada tick con el estado actual de filtros
        withLatestFrom(this.filterForm.valueChanges.pipe(startWith(this.filterForm.value))),
        switchMap(([_, filters]) => this.regulador.getSolicitudesRegistro().pipe(
          map((data) => {
            debugger;
            return this.applyFilters(data, filters);
          })
        )),
        tap((filtered) => this.updateTable(filtered)),
        catchError((err) => {
          console.error(err);
          this.spinner.hide();
          this.toastr.error(err.message || 'Error cargando registros', 'Error');
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private loadTranslations() {
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
      this.languageService.get('Nueva solicitud registrada'),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => {
        [
          this.titleAprove,
          this.labelAprove,
          this.titleReject,
          this.labelReject,
          this.titleToastDiligence,
          this.labelToastDiligence,
          this.titleToastTypeContractError,
          this.titleToastReject,
          this.titleTastNewApplication,
        ] = t;
      });
  }

  private applyFilters(data: SolicitudContrato[], filters: any): SolicitudContrato[] {
    return data.filter((item) => {
      const f = filters as Record<string, any>;
      return (
        (!f.empresa || item.infoContrato.empresa.toLowerCase().includes(f.empresa.toLowerCase())) &&
        (!f.contacto || item.infoContrato.contacto.toLowerCase().includes(f.contacto.toLowerCase())) &&
        (!f.ubicacion || item.infoContrato.departamento.toLowerCase().includes(f.ubicacion.toLowerCase())) &&
        (!f.correo || item.infoContrato.correo.toLowerCase().includes(f.correo.toLowerCase())) &&
        (f.tipoAgente == null || item.tipoContrato === f.tipoAgente) &&
        (f.estado == null || item.estadoSolicitud === f.estado)
      );
    });
  }

  private updateTable(filtered: SolicitudContrato[]) {
    // solo renderizamos si cambió el conteo
    const count = filtered.length;
    if ((count !== this.contadorAnterior && !this.diligenciandoSolicitud) || this.isInitialLoad) {
      this.dataSource.data = filtered;
      this.table.renderRows();

      if (!this.isInitialLoad && count > this.contadorAnterior) {
        this.toastr.success(this.titleTastNewApplication, this.labelToastDiligence);
      }

      this.contadorAnterior = count;
      this.isInitialLoad = false;
    }
  }

  onApprove(solicitud: SolicitudContrato) {
    this.diligenciandoSolicitud = true;
    this.alertDialog
      .confirmAlert(this.titleAprove, this.labelAprove)
      .then((res) => {
        if (!res.isConfirmed) {
          this.diligenciandoSolicitud = false;
          return;
        }
        const factory = this.factoryMap[solicitud.tipoContrato];
        if (!factory) {
          this.toastr.error(this.titleToastTypeContractError, 'Error');
          this.diligenciandoSolicitud = false;
          return;
        }
        this.spinner.show();
        from(factory.loadBlockChainContractData())
          .pipe(
            switchMap(() => factory.setFactoryContrato(solicitud.infoContrato)),
            tap(() => this.toastr.success(this.titleToastDiligence, this.labelToastDiligence)),
            catchError((err) => {
              console.error(err);
              this.toastr.error(err.message || 'Error al diligenciar', 'Error');
              return EMPTY;
            }),
            finalize(() => {
              this.spinner.hide();
              this.diligenciandoSolicitud = false;
            }),
            takeUntil(this.destroy$)
          )
          .subscribe();
      });
  }

  onReject(solicitud: SolicitudContrato) {
    this.diligenciandoSolicitud = true;
    this.alertDialog
      .confirmAlert(this.titleReject, this.labelReject)
      .then((res) => {
        if (!res.isConfirmed) {
          this.diligenciandoSolicitud = false;
          return;
        }
        this.spinner.show();
        this.regulador
          .diligenciarSolicitud(
            // asumimos que el servicio recibe el índice interno, o bien cambia al usar ID
            this.dataSource.data.indexOf(solicitud),
            solicitud.infoContrato,
            EstadoSolicitud.rechazada
          )
          .pipe(
            tap(() => this.toastr.info(this.titleToastReject, this.labelToastDiligence)),
            catchError((err) => {
              console.error(err);
              this.toastr.error(err.message || 'Error al rechazar', 'Error');
              return EMPTY;
            }),
            finalize(() => {
              this.spinner.hide();
              this.diligenciandoSolicitud = false;
            }),
            takeUntil(this.destroy$)
          )
          .subscribe();
      });
  }

  onfieldValueChange(event: FieldValueChange): void {
    // Parchea el FormGroup reactivo con el nuevo valor
    this.filterForm.patchValue({
      [event.controlName]: event.data
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
