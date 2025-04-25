import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ChangeDetectionStrategy,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import {
  forkJoin,
  BehaviorSubject,
  Observable,
  Subject,
  of,
  from,
  EMPTY,
  OperatorFunction,
} from 'rxjs';
import {
  switchMap,
  tap,
  catchError,
  finalize,
  takeUntil,
  shareReplay,
} from 'rxjs/operators';

import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { BonosCarbonoService } from 'src/app/services/bonos-carbono.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { TokenErc20Service } from 'src/app/services/token-erc20.service';
import { BonoCarbonoInfo } from 'src/app/models/BonoCarbonoInfo';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { MatDialog } from '@angular/material/dialog';
import { InfoBonoComponent } from 'src/app/shared/info-bono/info-bono.component';

/**
 * Reusable RxJS operator to show spinner, handle errors and hide spinner.
 */
function withLoading<T>(
  spinner: NgxSpinnerService,
  toastr: ToastrService
): OperatorFunction<T, T> {
  return (source$) =>
    source$.pipe(
      tap(() => spinner.show()),
      finalize(() => spinner.hide()),
      catchError((err) => {
        toastr.error(err.message ?? 'Error inesperado', 'Error');
        return EMPTY;
      })
    );
}

@Component({
  selector: 'app-bonos-carbono',
  templateUrl: './bonos-carbono.component.html',
  styleUrls: ['./bonos-carbono.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonosCarbonoComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Direcciones de contratos */
  contractAddress = '';
  bonoContractAddress = '';
  tokenContractAddress = '';
  agenteName = '';
  /** Saldo de tokens */
  misTokens = 0;
  senderAddress = '';
  /** Manejador de datos para la tabla */
  dataSource = new MatTableDataSource<BonoCarbonoInfo>();
  displayedColumns = [
    'id',
    'timestampGenerado',
    'toneladasCO2',
    'fuenteEnergia',
    'Precio',
    'vendido',
    'comprador',
    'timestampVenta',
    'actions',
  ];

  @ViewChild('tableWrapper', { static: true }) tableWrapper!: ElementRef;
  @ViewChild(MatTable, { static: true }) matTable!: MatTable<BonoCarbonoInfo>;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  private readonly destroy$ = new Subject<void>();

  /** Control de bonos (My vs All) */
  private isMyBonosMode = false;
  private readonly bonos$ = new BehaviorSubject<BonoCarbonoInfo[]>([]);
  isAgenteValido = false;

  constructor(
    private readonly regulador: ReguladorMercadoService,
    private readonly bonosCarbono: BonosCarbonoService,
    private readonly tokenService: TokenErc20Service,
    private readonly dialog: MatDialog,
    private readonly spinner: NgxSpinnerService,
    private readonly toastr: ToastrService,
    private readonly alertDialog: SweetAlertService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.agenteName = localStorage.getItem('nombreAgente') || '';
  }

  ngOnInit(): void {
    this.initStreams();
    this.subscribeToContractEvents();
  }

  ngAfterViewInit(): void {
    // Suscripción a cambios en bonos para poblar la tabla
    this.bonos$.pipe(takeUntil(this.destroy$)).subscribe((bonos) => {
      this.dataSource.data = bonos;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  private initStreams(): void {
    this.isAgenteValido = this.loadValidAgent();
    this.getContractAddress$()
      .pipe(
        tap((data) => {
          this.contractAddress = data.contract;
          this.senderAddress = data.sender;
        }),
        switchMap(() =>
          forkJoin({
            bonoAddr: this.regulador.getBonoCarbonoAddress(),
            tokenAddr: this.regulador.getTokenAddress(),
          })
        ),
        // ahora bonoAddr ya está listo, inicializamos el contrato...
        switchMap(({ bonoAddr, tokenAddr }) =>
          forkJoin({
            // inicializar ambos contratos en paralelo
            bonoInit: from(
              this.bonosCarbono.loadBlockChainContractData(bonoAddr)
            ),
            tokenInit: from(
              this.tokenService.loadBlockChainContractData(tokenAddr)
            ),
          }).pipe(
            tap(() => {
              this.bonoContractAddress = bonoAddr;
              this.tokenContractAddress = tokenAddr;
              debugger;
              this.subscribeToContractEvents();
            })
          )
        ),
        // una vez inicializados, ya podemos pedir bonos y tokens
        switchMap(() =>
          forkJoin({
            tokens: this.regulador
              .getTokensAgente(this.senderAddress)
              .pipe(withLoading(this.spinner, this.toastr)),
            misBonos: this.bonosCarbono
              .getBonosByOwner(this.senderAddress)
              .pipe(withLoading(this.spinner, this.toastr)),
            allBonos: this.bonosCarbono
              .getAllBonos()
              .pipe(withLoading(this.spinner, this.toastr)),
          })
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(({ tokens, misBonos, allBonos }) => {
        this.misTokens = tokens;
        this.bonos$.next(this.isMyBonosMode ? misBonos : allBonos);
      });
  }

  /** 1) Obtiene dirección principal desde localStorage */
  private getContractAddress$(): Observable<{
    contract: string;
    sender: string;
  }> {
    return of({
      contract: localStorage.getItem('dirContract') || '',
      sender: localStorage.getItem('account') || '',
    }).pipe(
      tap(({ contract, sender }) => {
        if (!contract) {
          throw new Error('No se encontró la dirección del contrato');
        }
        if (!sender) {
          throw new Error('No se encontró la dirección del remitente');
        }
      }),
      shareReplay(1)
    );
  }

  private loadValidAgent(): boolean {
    const tipoRaw = localStorage.getItem('tipoAgente');
    const tipo = parseInt(tipoRaw || '', 10) as TiposContratos;
    if (tipo === TiposContratos.Cliente || tipo === TiposContratos.Generador)
      return true;
    return false;
  }

  /** Handlers UI para alternar tabla */
  loadMisBonos(): void {
    this.isMyBonosMode = true;
    this.bonos$.next([]);
    this.bonosCarbono
      .getBonosByOwner(this.senderAddress)
      .pipe(withLoading(this.spinner, this.toastr), takeUntil(this.destroy$))
      .subscribe((b) => this.bonos$.next(b));
  }

  loadAllBonos(): void {
    this.isMyBonosMode = false;
    this.bonos$.next([]);
    this.bonosCarbono
      .getAllBonos()
      .pipe(withLoading(this.spinner, this.toastr), takeUntil(this.destroy$))
      .subscribe((b) => this.bonos$.next(b));
  }

  /** Compra un bono y refresca datos */
  buyBono(bono: BonoCarbonoInfo): void {
    this.alertDialog
      .confirmAlert(
        'Confirmar compra',
        `¿Deseas comprar el bono #${bono.id}?`,
        `Tokens disponibles: ${this.misTokens}`
      )
      .then((res) => {
        if (!res.isConfirmed) return;

        from(
          this.tokenService.loadBlockChainContractData(
            this.tokenContractAddress
          )
        )
          .pipe(
            switchMap(() =>
              this.tokenService.approve(
                this.bonoContractAddress,
                bono.toneladasCO2
              )
            ),
            switchMap(() =>
              this.bonosCarbono.comprarBono(bono.id, this.agenteName)
            ),
            switchMap(() =>
              forkJoin({
                bonos: this.bonosCarbono.getAllBonos(),
                tokens: this.regulador.getTokensAgente(this.senderAddress),
              })
            ),
            withLoading(this.spinner, this.toastr),
            takeUntil(this.destroy$)
          )
          .subscribe(({ bonos, tokens }) => {
            this.misTokens = tokens;
            if (this.isMyBonosMode) {
              this.bonosCarbono
                .getBonosByOwner(this.senderAddress)
                .pipe(
                  withLoading(this.spinner, this.toastr),
                  takeUntil(this.destroy$)
                )
                .subscribe((misBonos) => this.bonos$.next(misBonos));
            } else {
              this.bonos$.next(bonos);
            }
            this.toastr.success('Compra exitosa', 'Éxito');
          });
      });
  }

  getBonoInfo(bono: BonoCarbonoInfo): void {
    this.dialog.open(InfoBonoComponent, {
      width: '791px',
      height: '671px',
      data: {
        bonoInfo: bono,
        dirContratoAgente: this.contractAddress,
      },
    });
  }

  private subscribeToContractEvents(): void {
    // BonoGenerado: recargo lista de bonos cuando alguien genere uno nuevo
    this.bonosCarbono
      .onBonoGenerado()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          console.log('Evento BonoGenerado:', event.returnValues);
          this.refreshBonos();
        },
        error: (err) => console.error('Error en BonoGenerado:', err),
      });

    // BonoVendido: idem cuando se venda uno
    this.bonosCarbono
      .onBonoVendido()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          console.log('Evento BonoVendido:', event.returnValues);
          this.refreshBonos();
        },
        error: (err) => console.error('Error en BonoVendido:', err),
      });
  }

  private refreshBonos(): void {
    forkJoin({
      misBonos: this.bonosCarbono.getBonosByOwner(this.senderAddress),
      allBonos: this.bonosCarbono.getAllBonos(),
    })
      .pipe(withLoading(this.spinner, this.toastr), takeUntil(this.destroy$))
      .subscribe(({ misBonos, allBonos }) => {
        const nuevos = this.isMyBonosMode ? misBonos : allBonos;

        // actualiza el dataSource
        this.dataSource.data = nuevos;

        // reset paginador
        this.paginator.firstPage();

        // re-render de filas y sticky headers
        this.matTable.renderRows();

        // forzar cambio en OnPush
        this.cdr.detectChanges();
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
