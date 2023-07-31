import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable } from 'rxjs';
import { CompraEnergiaRequest } from 'src/app/models/CompraEnergiaRequest';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { InfoEmisionCompra } from 'src/app/models/InfoEmisionCompra';
import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { WinRefService } from 'src/app/services/win-ref.service';
import { InfoContrato } from './../../../models/infoContrato';
import { InfoGeneradorCompra, InfoPlantaCompra } from './../../../models/InfoPlantaCompra';
import { InfoPlantaEnergia } from './../../../models/InfoPlantaEnergia';
import { SolicitudContrato } from './../../../models/solicitudContrato';
import { SweetAlertService } from './../../../services/sweet-alert.service';

import { LanguageService } from 'src/app/services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-compra-energia',
  templateUrl: './compra-energia.component.html',
  styles: [
  ]
})
export class CompraEnergiaComponent implements OnInit, OnDestroy {
  dirContract: string
  generadoresDisponibles: InfoContrato[] = [];
  generadoresCompra: InfoGeneradorCompra[] = [];
  cantidadEnergiasDisponibles: number[][] = [];
  energiaAComprar: number[][] = [];
  generadoresContracts: GeneradorContractService[] = [];
  emision: InfoEmisionCompra;
  index: number;

  constructor(public dialogRef: MatDialogRef<CompraEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public winRef: WinRefService,
    public web3Connect: Web3ConnectService,
    private alert: SweetAlertService,
    private comercializador: ComercializadorContractService,
    public languageService: LanguageService) {
    this.emision = data.emision;
    this.index = data.index;
    this.dirContract = data.dirContract;
  }

  ngOnDestroy(): void {
    
  }


//   'Error al cargar la información del contrato'
// 'Error'
// 'Confirmación'
// '¿Está seguro de que desea comprar esta energía?'
// 'Energía comprada con éxito'
// 'Éxito'
// 'Error al comprar la energía'

  // TRADUCTOR
  private languageSubs: Subscription;
  // variables
  titleToastErrorData: string;
  labelToastErrorData: string;
  titleModalBuy: string;
  labelModalBuy1: string;
  titleToastSuccess: string;
  labelToastSuccess: string;
  titleToastErrorBuy: string;

  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      // this.languageService.get('Error al cargar las plantas de energía'),
      // this.languageService.get('Error'),
      // this.languageService.get('Plantas de energía')
      this.languageService.get('Error al cargar la información del contrato'),
      this.languageService.get('Error'),
      this.languageService.get('Confirmación'),
      this.languageService.get('¿Está seguro de que desea comprar esta energía?'),
      this.languageService.get('Energía comprada con éxito'),
      this.languageService.get('Éxito'),
      this.languageService.get('Error al comprar la energía')
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.titleToastErrorData = translatedTexts[0];
        this.labelToastErrorData = translatedTexts[1];
        this.titleModalBuy = translatedTexts[2];
        this.labelModalBuy1 = translatedTexts[3];
        this.titleToastSuccess = translatedTexts[4];
        this.labelToastSuccess = translatedTexts[5];
        this.titleToastErrorBuy = translatedTexts[6];

        // this.titleToastErrorData = translatedTexts[0];
        // this.labelToastErrorData = translatedTexts[1];
        // this.tipoMapa = translatedTexts[2];

      },
      error: err => {
        console.log(err);
      }
    })
  }


  async ngOnInit(): Promise<void> {
this.languageSubs = this.languageService.language.subscribe({
        next: language => {
          this.initializeTranslations();
          console.log('language: ', language);
        },
        error: err => {
          console.log(err);
        }
      });

    await this.reguladorMercado.loadBlockChainContractData();
    await this.comercializador.loadBlockChainContractData(this.dirContract);
    this.spinner.show();
    this.reguladorMercado.getContratosRegistrados().subscribe({
      next: (data: SolicitudContrato[]) => {
        this.generadoresDisponibles = data.filter(solicitud => solicitud.tipoContrato == TiposContratos.Generador).map(solicitud => {
          return solicitud.infoContrato;
        });
        let observables: Observable<InfoPlantaEnergia[]>[] = [];
        let promises: Promise<void>[] = [];
        this.generadoresDisponibles.forEach(generador => {
          const contract = new GeneradorContractService(this.winRef, this.web3Connect, this.toastr);
          this.generadoresContracts.push(contract);
          promises.push(contract.loadBlockChainContractData(generador.dirContrato));
        });

        Promise.all(promises).then((response: void[]) => {
          for (let i = 0; i < response.length; i++) {
            observables.push(this.generadoresContracts[i].getPlantasEnergia());
          }

          forkJoin(observables).subscribe({
            next: (data: InfoPlantaEnergia[][]) => {
              for (let i = 0; i < data.length; i++) {
                let tempInfoGeneradorCompra: InfoGeneradorCompra = {
                  dirGenerador: this.generadoresDisponibles[i].dirContrato,
                  nombre: this.generadoresDisponibles[i].empresa,
                  plantasGenerador: data[i].filter(planta => planta.tecnologia == this.emision.tipoEnergia).map(planta => {
                    const { dirPlanta, nombre, tecnologia, cantidadEnergia } = planta;
                    const tempInfo: InfoPlantaCompra = {
                      dirPlanta,
                      nombre,
                      tipoEneregia: tecnologia,
                      cantidadEnergia
                    }

                    return tempInfo;
                  })

                }

                if (tempInfoGeneradorCompra.plantasGenerador.length > 0) {
                  this.generadoresCompra.push(tempInfoGeneradorCompra);
                  this.energiaAComprar.push(new Array(tempInfoGeneradorCompra.plantasGenerador.length).fill(0));
                  this.cantidadEnergiasDisponibles
                    .push(tempInfoGeneradorCompra.plantasGenerador.map(planta => planta.cantidadEnergia));
                }
              }
              console.log(this.cantidadEnergiasDisponibles);
              this.spinner.hide();
            }, error: (err) => {
              console.log(err);
              this.toastr.error(this.titleToastErrorData, this.labelToastErrorData);
              this.spinner.hide();
            }
          });
        })
      }, error: error => {
        this.spinner.hide();
        this.toastr.error(error.message, this.labelToastErrorData);
      }
    })
  }

  onAumentarCantidad(i: number, j: number): void {
    if (this.energiaAComprar[i][j] < this.cantidadEnergiasDisponibles[i][j]) {
      this.energiaAComprar[i][j]++;
    }
  }

  onDisminuirCantidad(i: number, j: number): void {
    if (this.energiaAComprar[i][j] > 0) {
      this.energiaAComprar[i][j]--;
    }
  }

  onComprarEnergia(): void {
    let observables: Observable<any>[] = [];
    this.alert.confirmAlert(this.titleModalBuy, this.labelModalBuy1)
      .then(result => {
        if (result.isConfirmed) {
          // this.energiaAComprar.forEach((cantidad, index) => {
          //   if (cantidad > 0) {
          //     let compraRequest: CompraEnergiaRequest = {
          //       ownerCliente: this.emision.ownerCliente,
          //       dirContratoGenerador: this.generadoresDisponibles[index].dirContrato,
          //       cantidadEnergia: cantidad,
          //       tipoEnergia: this.emision.tipoEnergia,
          //       index: this.emision.index
          //     }
          //     observables.push(this.comercializador.ComprarEnergia(compraRequest));
          //   }
          // });

          this.energiaAComprar.forEach((energiasGenerador, i) => {
            energiasGenerador.forEach((cantidad, j) => {
              if (cantidad > 0) {
                let compraRequest: CompraEnergiaRequest = {
                  dirContratoGenerador: this.generadoresCompra[i].dirGenerador,
                  dirPlantaGenerador: this.generadoresCompra[i].plantasGenerador[j].dirPlanta,
                  ownerCliente: this.emision.ownerCliente,
                  cantidadEnergia: cantidad,
                  tipoEnergia: this.emision.tipoEnergia,
                  index: this.emision.index
                }
                observables.push(this.comercializador.ComprarEnergia(compraRequest));
              }
            });
          });

          this.spinner.show();
          forkJoin(observables).subscribe({
            next: (data: any[]) => {
              this.toastr.success(this.titleToastSuccess, this.labelToastSuccess);
              this.spinner.hide();
              this.dialogRef.close();
            }, error: (err) => {
              console.log(err);
              this.toastr.error(this.titleToastErrorBuy, this.labelToastErrorData);
              this.spinner.hide();
              this.dialogRef.close();
            }
          })
        }
      })
  }

  get isComprarValid(): boolean {
    let total = 0;
    this.energiaAComprar.forEach(cantidad => {
      total += cantidad.reduce((a, b) => a + b, 0);
    });

    if (total == this.emision.cantidadDeEnergia) {
      return true;
    }

    return false;
  }

  get totalEnergiaAComprar(): number {
    let total = 0;
    this.energiaAComprar.forEach(cantidad => {
      total += cantidad.reduce((a, b) => a + b, 0);
    });
    return total;
  }

  onCantidadChange(i: number, j: number, event: any) {

    if (this.energiaAComprar[i][j] >= this.cantidadEnergiasDisponibles[i][j]) {
      this.energiaAComprar[i][j] = this.cantidadEnergiasDisponibles[i][j];
      event.target.value = this.cantidadEnergiasDisponibles[i][j];
    }

    if (this.energiaAComprar[i][j] <= 0) {
      this.energiaAComprar[i][j] = 0;
      event.target.value = 0;
    }
  }
}
