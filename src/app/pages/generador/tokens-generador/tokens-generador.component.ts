import { GeneradorContractService } from './../../../services/generador-contract.service';
import { Component, OnInit, NgZone } from '@angular/core';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-tokens-generador',
  templateUrl: './tokens-generador.component.html',
  styles: [
  ]
})
export class TokensGeneradorComponent implements OnInit {
  compraEnergiaEvent: any;
  tokensGenerador: number;
  tokensEnPesos: number;

  constructor(private reguladorMercado: ReguladorMercadoService,
    private generador: GeneradorContractService,
    private ngZone: NgZone,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private alertDialog: SweetAlertService) { }

  async ngOnInit(): Promise<void> {
    try {
      let dirContract = localStorage.getItem('dirContract');
      this.spinner.show();
      let promises: Promise<void>[] = []
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.generador.loadBlockChainContractData(dirContract));
      await Promise.all(promises);
      this.getTokensGenerador();
      this.compraEnergiaEvent = this.generador.contract.events.compraEnergia({
        fromBlock: 'latest'
      }, (error, event) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }).on('data', () => {
        this.ngZone.run(() => {
          this.toastr.success('Compra de energía realizada', 'Energía');
          this.getTokensGenerador();
        })
      })

      this.spinner.hide();
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  getTokensGenerador() {
    this.generador.getMisTokens().subscribe({
      next: data => {
        this.tokensGenerador = data;
        this.getTokensPesos();
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    })
  }

  getTokensPesos() {
    this.tokensEnPesos = 0.001 * 1500 * 4500 * this.tokensGenerador;
  }

  onCobrarTokens() {
    this.alertDialog.confirmAlert('Confirmar devolución', `¿Desea continuar con el cambio de ${this.tokensGenerador} tokens?`)
      .then(result => {
        if (result.isConfirmed) {
          this.spinner.show();
          this.reguladorMercado.postDevolverTokens(this.tokensGenerador).subscribe({
            next: () => {
              this.spinner.hide();
              this.toastr.success('Tokens devueltos correctamente', 'Éxito');
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

  get isCobrarValid(): boolean {
    if (this.tokensGenerador > 0) {
      return true;
    } else {
      return false;
    }
  }
}
