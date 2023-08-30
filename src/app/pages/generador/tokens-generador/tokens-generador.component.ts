import { switchMap } from 'rxjs';
import { GeneradorContractService } from './../../../services/generador-contract.service';
import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { ComprarTokensComponent } from './comprar-tokens/comprar-tokens.component';
import { MatDialog } from '@angular/material/dialog';

import { Subscription, forkJoin } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-tokens-generador',
  templateUrl: './tokens-generador.component.html',
  styles: [
  ]
})
export class TokensGeneradorComponent implements OnInit, OnDestroy {

  liquidacionInyeccionEvent: any;
  liquidacionContratoEvent: any;
  compraEnergiaEvent: any;
  tokensGenerador: number;
  tokensEnPesos: number;
  dirContract: string;


  constructor(private reguladorMercado: ReguladorMercadoService,
    private generador: GeneradorContractService,
    public dialog: MatDialog,
    private ngZone: NgZone,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService,
    private languageService: LanguageService) { }


  ngOnDestroy(): void {
    if (this.compraEnergiaEvent) {
      this.compraEnergiaEvent.removeAllListeners('data')
    }
    if (this.liquidacionInyeccionEvent) {
      this.liquidacionInyeccionEvent.removeAllListeners('data')
    }
    if (this.liquidacionContratoEvent) {
      this.liquidacionContratoEvent.removeAllListeners('data')
    }
  }

  // TRADUCTOR
  private languageSubs: Subscription;
  // variables
//   'Confirmar devolución'
// `¿Desea continuar con el cambio de
// 'Tokens devueltos correctamente'
// 'Éxito'
  confirmReturn: string = '';
  confirmReturnMessage: string = '';
  returnSuccess: string = '';
  success: string = '';

  initializeTranslations(): void {
    forkJoin([
      // this.languageService.get('Diligenciar solicitud'),
      this.languageService.get('Confirmar devolución'),
      this.languageService.get('¿Desea continuar con el cambio de'),
      this.languageService.get('Tokens devueltos correctamente'),
      this.languageService.get('Éxito')
    ]).subscribe({
      next: translatedTexts => {
      console.log('translatedTexts: ', translatedTexts);
      // this.titleToastErrorData = translatedTexts[0];
      this.confirmReturn = translatedTexts[0];
      this.confirmReturnMessage = translatedTexts[1];
      this.returnSuccess = translatedTexts[2];
      this.success = translatedTexts[3];
      
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
      let dirContract = localStorage.getItem('dirContract');
      this.spinner.show();
      let promises: Promise<void>[] = []
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.generador.loadBlockChainContractData(dirContract));
      await Promise.all(promises);
      this.spinner.hide();
      this.getTokensGenerador();
      
      this.setEvents();

    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  private setEvents() {
    this.compraEnergiaEvent = this.generador.contract.events.compraEnergia({
      fromBlock: 'latest'
    }, (error) => {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }).on('data', () => {
      this.ngZone.run(() => {
        this.getTokensGenerador();
      });
    });

    this.liquidacionInyeccionEvent = this.generador.contract.events.liquidacionInyeccion({
      fromBlock: 'latest'
    }, (error) => {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }).on('data', () => {
      this.ngZone.run(() => {
        this.getTokensGenerador();
      });
    });

    this.liquidacionContratoEvent = this.generador.contract.events.liquidacionContrato({
      fromBlock: 'latest'
    }, (error) => {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }).on('data', () => {
      this.ngZone.run(() => {
        this.getTokensGenerador();
      });
    });
  }

  getTokensGenerador() {
    this.spinner.show();
    this.generador.getInfoContrato().pipe(
      switchMap(data => {
        return this.reguladorMercado.getTokensAgente(data.owner)
      })
    ).subscribe({
      next: data => {
        this.tokensGenerador = data;
        this.getTokensPesos();
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }

  getTokensPesos() {
    this.tokensEnPesos = 0.001 * 1500 * 4500 * this.tokensGenerador;
  }

  onCobrarTokens() {
    this.alertDialog.confirmAlert(this.confirmReturn, this.confirmReturnMessage + ' ' + `${this.tokensGenerador} tokens?`)
      .then(result => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.reguladorMercado.postDevolverTokens(this.tokensGenerador).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success(this.returnSuccess, this.success);
              this.getTokensGenerador();
            },
            error: (error) => {
              console.log(error);
              this.toastr.error(error.message, 'Error');
              this.spinner.hide();
            }
          })
        }
      })
  }

  onComprarTokens() {
    const dialogRef = this.dialog.open(ComprarTokensComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.getTokensGenerador();
      }
    })
  }

  get isCobrarValid(): boolean {
    if (this.tokensGenerador > 0) {
      return true;
    } else {
      return false;
    }
  }
}
