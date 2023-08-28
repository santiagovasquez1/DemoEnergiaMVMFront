import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { DespachosEnergiaService } from './../../../services/despachos-energia.service';
import { EstadoSolicitud } from './../../../models/solicitudContrato';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, switchMap, of, forkJoin, from } from 'rxjs';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { TableService } from 'src/app/services/shared/table-service.service';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { OrdenDespacho } from 'src/app/models/OrdenDespacho';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { WinRefService } from 'src/app/services/win-ref.service';
import moment from 'moment';

import { LanguageService } from 'src/app/services/language.service';
import { Subscription} from 'rxjs';

@Component({
  selector: 'app-ordenes-despacho',
  templateUrl: './ordenes-despacho.component.html',
  styleUrls: ['./ordenes-despacho.component.css']
})
export class OrdenesDespachoComponent implements OnInit, OnDestroy {

  estadosSolicitud: EstadoSolicitud[];
  tiposDeAgentes: TiposContratos[];

  displayedColumns: string[] = ['generador', 'capacidadNominal', 'cantidadProducida', 'despacho', 'acciones'];
  contadorAnterior = 0;
  contadorActual = 0;
  isFromInit: boolean = false;
  diligenciandoSolicitud: boolean = false;
  reloadData: boolean = false;

  dataSource: MatTableDataSource<OrdenDespacho>;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('table', { static: true }) table: MatTable<any>;
  sort: MatSort;
  contratoDiligenciadoEvent: any;
  inyeccionDespachoEvent: any;
  filterFormProperties: RowFilterForm[] = [];
  listCreacionPlantasEvents: any[] = [];

  //Filtros:
  filters = {
    nombreGenerador: '',
    capacidadNominal: '',
    energiaDespachada: ''
  }


  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private despachosEnergia: DespachosEnergiaService,
    private tableService: TableService,
    private spinner: NgxSpinnerService,
    private sweetAlert: SweetAlertService,
    private ngZone: NgZone,
    private winRef: WinRefService,
    private web3Connect: Web3ConnectService,
    public languageService: LanguageService) {
    this.dataSource = new MatTableDataSource();

    this.filterFormProperties = [{
      fields: [{
        label: 'Generador',
        formControlName: 'nombreGenerador',
        controlType: 'text',
        pipe: ''
      }, {
        label: 'Capacidad Nominal (Mw)',
        formControlName: 'capacidadNominal',
        controlType: 'number',
        pipe: ''
      }, {
        label: 'Energia Despachada (Mw)',
        formControlName: 'energiaDespachada',
        controlType: 'number',
        pipe: ''
      }]
    }]
  }

  ngOnDestroy(): void {
    this.contratoDiligenciadoEvent.removeAllListeners('data');
    this.inyeccionDespachoEvent.removeAllListeners('data');
    this.listCreacionPlantasEvents.forEach((creacionEvent: any) => {
      creacionEvent.removeAllListeners('data');
    });
  }

  // #TRADUCCIONES
  private languageSubs: Subscription;
//   'Despacho de energia'
// `¿Deseas despachar ${ordenDespacho.cantidadEnergia}Mw al generador ${ordenDespacho.nombreGenerador}`
// 'Despacho realizado con exito'
// 'Despacho'
// 'Modificación de despacho realizado con exito'
// 'Despacho'
  titleDispatchEnergy: string;
  messageDispatchEnergy1: string;
  messageDispatchEnergy2: string;
  titleToastSuccessDispatch: string;
  titleToastDispatch: string;
  titleToastSuccessEditDispatch: string;
  titleToastEditDispatch: string;


  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      this.languageService.get('Despacho de energia'),
      this.languageService.get('¿Deseas despachar'),
      this.languageService.get('Mw al generador'),
      this.languageService.get('Despacho realizado con exito'),
      this.languageService.get('Despacho'),
      this.languageService.get('Modificación de despacho realizado con exito'),
      this.languageService.get('Despacho')
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        // this.titleToastErrorData = translatedTexts[0];
        this.titleDispatchEnergy = translatedTexts[0];
        this.messageDispatchEnergy1 = translatedTexts[1];
        this.messageDispatchEnergy2 = translatedTexts[2];
        this.titleToastSuccessDispatch = translatedTexts[3];
        this.titleToastDispatch = translatedTexts[4];
        this.titleToastSuccessEditDispatch = translatedTexts[5];
        this.titleToastEditDispatch = translatedTexts[6];
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

      this.spinner.show();
      let promises: Promise<void>[] = [];
      promises.push(this.regulardorMercado.loadBlockChainContractData());
      promises.push(this.despachosEnergia.loadBlockChainContractData());
      await Promise.all(promises);
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

      this.inyeccionDespachoEvent = this.despachosEnergia.contract.events.inyeccionDespacho({
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
          let infoGeneradorDespacho = {
            dirGenerador: solicitud.infoContrato.dirContrato,
            nombreGenerador: solicitud.infoContrato.empresa
          };
          return infoGeneradorDespacho
        }));
      })
    ).subscribe({
      next: data => {
        let timeNow = moment(Date.now()).hour(0).minute(0).second(0);
        let getDespachosObservables: Observable<OrdenDespacho>[] = [];

        data.forEach(element => {
          getDespachosObservables.push(this.despachosEnergia.getDespachosByGeneradorAndDate(element.dirGenerador, element.nombreGenerador, timeNow.unix()));
        });

        forkJoin(getDespachosObservables).subscribe({
          next: (ordenesDespacho) => {
            let filterData = this.filterData(ordenesDespacho);
            this.dataSource.data = filterData;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loadGeneradoresEvents(filterData);
            this.table.renderRows();
          },
          error: (error) => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
          }
        })
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
      }
    })
  }

  private loadGeneradoresEvents(ordenesDespacho: OrdenDespacho[]) {
    this.listCreacionPlantasEvents.forEach((creacionEvent: any) => {
      creacionEvent.removeAllListeners('data');
    });
    this.listCreacionPlantasEvents = [];
    let obsContractData: Observable<void>[] = [];
    let generadoresContracts: GeneradorContractService[] = [];
    ordenesDespacho.forEach(orden => {
      let generadorContractService: GeneradorContractService = new GeneradorContractService(this.winRef, this.web3Connect, this.toastr);
      obsContractData.push(from(generadorContractService.loadBlockChainContractData(orden.dirGenerador)));
      generadoresContracts.push(generadorContractService);
    });

    forkJoin(obsContractData).subscribe({
      next: data => {
        data.forEach((element, index) => {
          this.listCreacionPlantasEvents.push(
            generadoresContracts[index].contract.events.creacionPlanta({
              fromBlock: 'latest'
            }, (err, event) => {
              if (err) {
                console.log(err);
                this.toastr.error(err.message, 'Error');
              }
            }).on('data', (event) => {
              this.ngZone.run(() => {
                this.getGeneradores();
              })
            })
          )
        })
      },
      error: error => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    })
  }

  onDespacharEnergia(ordenDespacho: OrdenDespacho) {
    this.sweetAlert.confirmAlert(this.titleDispatchEnergy, ' ' +  this.messageDispatchEnergy1 + ' ' + ordenDespacho.cantidadEnergia + ' ' + this.messageDispatchEnergy2 + ' ' + ordenDespacho.nombreGenerador).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        if (ordenDespacho.index == null) {
          this.despachosEnergia.setDespachoEnergia(ordenDespacho.dirGenerador, ordenDespacho.cantidadEnergia).subscribe({
            next: (() => {
              this.getGeneradores();
              this.spinner.hide();
              this.toastr.success(this.titleToastSuccessDispatch, this.titleToastDispatch);
            }),
            error: error => {
              console.log(error);
              this.toastr.error(error.message, 'Error');
            }
          });
        } else {
          let timeNow = Math.floor(Date.now() / 1000);
          this.despachosEnergia.editCantidadDespacho(ordenDespacho.dirGenerador, ordenDespacho.cantidadEnergia,
            timeNow, ordenDespacho.index).subscribe({
              next: () => {
                this.getGeneradores();
                this.spinner.hide();
                this.toastr.success(this.titleToastSuccessEditDispatch, this.titleToastEditDispatch);
              },
              error: error => {
                console.log(error);
                this.toastr.error(error.message, 'Error');
              }
            });
        }
      }
    });
  }


  onfieldValueChange(event: FieldValueChange) {
    this.filters[event.controlName] = event.data
    this.getGeneradores();
  }

  private filterData(data: OrdenDespacho[]): OrdenDespacho[] {
    let filterArray = data
    filterArray = this.filters.nombreGenerador !== '' ? filterArray.filter(item => item.nombreGenerador.toLowerCase().includes(this.filters.nombreGenerador)) : filterArray;
    filterArray = this.filters.capacidadNominal !== '' ? filterArray.filter(item => item.capacidadNominal === parseInt(this.filters.capacidadNominal)) : filterArray;
    filterArray = this.filters.capacidadNominal !== '' ? filterArray.filter(item => item.cantidadProducida === parseInt(this.filters.energiaDespachada)) : filterArray;

    return filterArray;
  }

}
