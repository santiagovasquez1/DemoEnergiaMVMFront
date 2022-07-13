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

@Component({
  selector: 'app-cliente-dashboard',
  templateUrl: './cliente-dashboard.component.html',
  styles: [
  ]
})
export class ClienteDashboardComponent implements OnInit {
  infoCliente: InfoContrato;
  tokensCliente: number = 0;

  constructor(private clienteService: ClienteContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    public dialog: MatDialog) { }

  async ngOnInit(): Promise<void> {
    let dirContract = localStorage.getItem('dirContract');
    try {
      await this.clienteService.loadBlockChainContractData(dirContract);
      this.clienteService.getInfoContrato().subscribe({
        next: (info) => {
          this.infoCliente = info;
        }, error: (err) => {
          console.log(err);
          this.toastr.error('Error al cargar la información del contrato', 'Error');
        }
      });
      this.clienteService.getMisTokens().subscribe({
        next: (data) => {
          this.tokensCliente = data;
        }, error: (error) => {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar el contrato cliente", 'Error');
    }
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
        dirContrato: localStorage.getItem('dirContract')
      }
    });
  }

  onComprarEnergia() {
    let dialogRef = this.dialog.open(ComprarEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract')
      }
    });
  }
}
