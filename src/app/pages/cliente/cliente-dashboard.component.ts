import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { InfoContrato } from './../../models/infoContrato';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Component, OnInit } from '@angular/core';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { MatDialog } from '@angular/material/dialog';
import { ComprarTokensComponent } from './comprar-tokens/comprar-tokens.component';
import { ContratarComercializadorComponent } from './contratar-comercializador/contratar-comercializador.component';
import { ComprarEnergiaComponent } from './comprar-energia/comprar-energia.component';
import { DevolverTokensComponent } from './devolver-tokens/devolver-tokens.component';
import { Observable, forkJoin } from 'rxjs';
import { DelegarTokensComponent } from './delegar-tokens/delegar-tokens.component';

@Component({
  selector: 'app-cliente-dashboard',
  templateUrl: './cliente-dashboard.component.html',
  styles: [
  ]
})
export class ClienteDashboardComponent implements OnInit {
  infoCliente: InfoContrato;
  tokensCliente: number = 0;
  tokensDelegados: number = 0;

  constructor(private clienteService: ClienteContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private reguladorMercado: ReguladorMercadoService) { }

  async ngOnInit(): Promise<void> {
    let dirContract = localStorage.getItem('dirContract');
    try {
      await this.reguladorMercado.loadBlockChainContractData();
      await this.clienteService.loadBlockChainContractData(dirContract);
      this.clienteService.getInfoContrato().subscribe({
        next: (info) => {
          debugger;
          this.infoCliente = info;
          this.getTokensCliente().subscribe({
            next: (data) => {
              debugger;
              this.tokensCliente = data[0];
              this.tokensDelegados = data[1] ? data[1] : 0;
            }, error: (error) => {
              console.log(error);
              this.toastr.error(error.message, 'Error');
            }
          })
        }, error: (err) => {
          console.log(err);
          this.toastr.error('Error al cargar la información del contrato', 'Error');
        }
      });

    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar el contrato cliente", 'Error');
    }
  }

  getTokensCliente(): Observable<number[]> {
    let observables: Observable<number>[] = [];
    observables.push(this.clienteService.getMisTokens());
    debugger;
    if (this.infoCliente.comercializador !== '0x0000000000000000000000000000000000000000') {
      observables.push(this.reguladorMercado.getTokensDelegados(this.infoCliente.comercializador));
    }
    return forkJoin(observables)
  }

  onComprarTokens() {
    let dialogRef = this.dialog.open(ComprarTokensComponent, {
      width: '500px'
    })

    dialogRef.afterClosed().subscribe(result => {
      this.spinner.show();
      this.clienteService.getMisTokens().subscribe({
        next: (data) => {
          this.tokensCliente = data;
          this.spinner.hide();
        }, error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
          this.spinner.hide();
        }
      });
    })
  }

  onDevolverTokens() {
    let dialogRef = this.dialog.open(DevolverTokensComponent, {
      width: '500px',
      data: {
        tokensDisponibles: this.tokensCliente
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.spinner.show();
      this.clienteService.getMisTokens().subscribe({
        next: (data) => {
          this.tokensCliente = data;
          this.spinner.hide();
        }, error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
          this.spinner.hide();
        }
      });
    })
  }

  onContratarComercializador() {
    let dialogRef = this.dialog.open(ContratarComercializadorComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        comercializador: this.infoCliente.comercializador
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.spinner.show();
      this.clienteService.getInfoContrato().subscribe({
        next: (data) => {
          this.infoCliente = data;
          this.spinner.hide();
        }, error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
          this.spinner.hide();
        }
      })
    })
  }

  onComprarEnergia() {
    let dialogRef = this.dialog.open(ComprarEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        tokensDelegados: this.tokensDelegados
      }
    });
  }

  onDelegarTokens() {
    let dialogRef = this.dialog.open(DelegarTokensComponent, {
      width: '500px',
      data: {
        tokensCliente: this.tokensCliente,
        delegateAddress: this.infoCliente.comercializador
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.spinner.show();
      this.getTokensCliente().subscribe({
        next: (data) => {
          this.tokensCliente = data[0];
          this.tokensDelegados = data[1];
          this.spinner.hide();
        }, error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
          this.spinner.hide();
        }
      })
    })
  }

  get isDelegarValid(): boolean {
    return this.infoCliente.comercializador !== '0x0000000000000000000000000000000000000000' && this.tokensCliente > 0;
  }

  get ComprarIsValid(): boolean {
    return this.tokensDelegados > 0;
  }
}
