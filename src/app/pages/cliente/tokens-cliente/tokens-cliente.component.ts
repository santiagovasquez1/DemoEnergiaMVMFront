import { AcuerdoContractService } from 'src/app/services/acuerdo-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';
import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, forkJoin, from, of, Subscription } from 'rxjs';
import { InfoContrato } from 'src/app/models/infoContrato';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';

import { LanguageService } from 'src/app/services/language.service';


@Component({
  selector: 'app-tokens-cliente',
  templateUrl: './tokens-cliente.component.html',
  styles: [
  ]
})
export class TokensClienteComponent implements OnInit, OnDestroy {
  infoCliente: InfoContrato;
  tokensCliente: number = 0;
  tokensMercado: number = 0;
  liquidacionAcuerdo: any;

  tokensComprar: number | string = '';
  tokensDelegar: number | string = '';
  tokensCambiar: number | string = '';

  constructor(private clienteService: ClienteContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private reguladorMercado: ReguladorMercadoService,
    private bancoEnergia: BancoEnergiaService,
    private acuerdosLedger: AcuerdoContractService,
    private ngZone: NgZone,
    private alertDialog: SweetAlertService,
    private languageService: LanguageService
    ) { }


  // TRADUCTOR
  private languageSubs: Subscription;
  // variables
  titleModalBuy: string;
  labelModalBuy1: string;
  labelModalBuy2: string;


  purchaseSuccessLabel: string;
  successLabel: string;
  confirmDelegationLabel: string;
  continueDelegationPromptLabel: string;
  delegationSuccessLabel: string;
  confirmRefundLabel: string;
  continueTokenChangePromptLabel: string;
  tokensReturnedSuccessfullyLabel: string;


//   'Compra realizada con éxito'
// 'Éxito'
// 'Confirmar delegación'
// `¿Desea continuar con la delegacion de
// tokens?`
// 'Delegación realizada con éxito'
// 'Éxito'
// 'Confirmar devolución'
// `¿Desea continuar con el cambio de
// tokens?`
// 'Tokens devueltos correctamente'
// 'Éxito'


  initializeTranslations(): void {
    forkJoin([
      this.languageService.get('Confirmar compra'),
      this.languageService.get('¿Deseas continuar con la compra de'),
      this.languageService.get('tokens?'),
      //   'Compra realizada con éxito'
        // 'Éxito'
        // 'Confirmar delegación'
        // `¿Desea continuar con la delegacion de
        // tokens?`
        // 'Delegación realizada con éxito'
        // 'Éxito'
        // 'Confirmar devolución'
        // `¿Desea continuar con el cambio de
        // tokens?`
        // 'Tokens devueltos correctamente'
        // 'Éxito'
      this.languageService.get('Compra realizada con éxito'),
      this.languageService.get('Éxito'),
      this.languageService.get('Confirmar delegación'),
      this.languageService.get('¿Desea continuar con la delegacion de'),
      this.languageService.get('Delegación realizada con éxito'),
      this.languageService.get('Confirmar devolución'),
      this.languageService.get('¿Desea continuar con el cambio de'),
      this.languageService.get('Tokens devueltos correctamente'),
      
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.titleModalBuy = translatedTexts[0];
        this.labelModalBuy1 = translatedTexts[1];
        this.labelModalBuy2 = translatedTexts[2];

        this.purchaseSuccessLabel = translatedTexts[3];
        this.successLabel = translatedTexts[4];
        this.confirmDelegationLabel = translatedTexts[5];
        this.continueDelegationPromptLabel = translatedTexts[6];
        this.delegationSuccessLabel = translatedTexts[7];
        this.confirmRefundLabel = translatedTexts[8];
        this.continueTokenChangePromptLabel = translatedTexts[9];
        this.tokensReturnedSuccessfullyLabel = translatedTexts[10];
        
        
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
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.acuerdosLedger.loadBlockChainContractData());
      promises.push(this.clienteService.loadBlockChainContractData(dirContract));
      await Promise.all(promises);
      this.spinner.hide();
      this.getInfoContrato();
      this.liquidacionAcuerdo = this.acuerdosLedger.contract.events.liquidacionAcuerdo({
        fromBlock: 'latest'
      }, (error, data) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      }).on('data',()=>{
        this.ngZone.run(()=>{
          this.getInfoContrato();
        })
      })
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }

  }

  ngOnDestroy(): void {
    if (this.liquidacionAcuerdo) {
      this.liquidacionAcuerdo.removeAllListeners();
    }
  }

  getInfoContrato() {
    this.spinner.show();
    this.clienteService.getInfoContrato().subscribe({
      next: (data) => {
        this.infoCliente = data;
        let observables: Observable<number>[] = [];
        observables.push(this.clienteService.getMisTokens());
        observables.push(this.reguladorMercado.getTokensDisponibles());

        forkJoin(observables).subscribe({
          next: (data: number[]) => {
            this.tokensCliente = data[0];
            this.tokensMercado = data[1];
            this.spinner.hide();
          },
          error: (error) => {
            console.log(error);
            this.spinner.hide();
            this.toastr.error(error.message, 'Error');
          }
        });
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  get isComprarValid(): boolean {
    if (this.tokensComprar > 0 && this.tokensComprar !== '' && this.tokensComprar <= this.tokensMercado) {
      return true
    } else {
      return false;
    }
  }

  get isDevolverValid(): boolean {
    if (this.tokensCambiar > 0 && this.tokensCambiar !== '' && this.tokensCambiar <= this.tokensCliente) {
      return true;
    } else {
      return false;
    }
  }

  onComprar() {
    this.alertDialog.confirmAlert(this.titleModalBuy, this.labelModalBuy1 + ' ' +  this.tokensComprar + ' tokens?').then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        const tokensComprar = typeof this.tokensComprar == 'string' ? parseInt(this.tokensComprar) : this.tokensComprar
        this.reguladorMercado.postComprarTokens(tokensComprar).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success(this.purchaseSuccessLabel, this.successLabel);
            this.tokensComprar = '';
            this.getInfoContrato();
          }, error: (error) => {
            this.spinner.hide();
            console.log(error);
            this.toastr.error(error.message, 'Error');
          }
        })
      }
    })
  }

  onDelegar() {
    this.alertDialog.confirmAlert(this.confirmDelegationLabel, this.continueDelegationPromptLabel + '' +  this.tokensDelegar + ' ' + this.delegationSuccessLabel).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        let tokensDelegados = typeof this.tokensDelegar == 'string' ? parseInt(this.tokensDelegar) : this.tokensDelegar;
        let delegateAddress = this.infoCliente.comercializador;
        this.reguladorMercado.postDelegarTokens(delegateAddress, tokensDelegados).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success(this.delegationSuccessLabel, this.successLabel);
            this.tokensDelegar = '';
            this.getInfoContrato()
          }
        })
      }
    }).catch((error) => {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    });
  }

  onCambiar() {
    this.alertDialog.confirmAlert(this.confirmRefundLabel, this.continueTokenChangePromptLabel + ' ' + `${this.tokensCambiar} tokens?`).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        let tokensCambiar = typeof this.tokensCambiar == 'string' ? parseInt(this.tokensCambiar) : this.tokensCambiar;
        this.reguladorMercado.postDevolverTokens(tokensCambiar).subscribe({
          next: () => {
            this.spinner.hide();
            this.toastr.success(this.tokensReturnedSuccessfullyLabel, this.successLabel);
            this.tokensCambiar = '';
            this.getInfoContrato();
          },
          error: (error) => {
            console.log(error);
            this.toastr.error(error.message, 'Error');
            this.spinner.hide();
          }
        });
      }
    });
  }
}
