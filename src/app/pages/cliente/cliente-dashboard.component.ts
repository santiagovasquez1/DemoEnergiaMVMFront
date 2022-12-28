import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ThemeService } from 'ng2-charts';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable } from 'rxjs';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { InfoCertificadoAgenteComponent } from 'src/app/shared/info-certificado-agente/info-certificado-agente.component';
import { DevolverTokensComponent } from '../devolver-tokens/devolver-tokens.component';
import { InfoContrato } from './../../models/infoContrato';
import { BancoEnergiaService } from './../../services/banco-energia.service';
import { CertificadorContractService } from './../../services/certificador-contract.service';
import { ComprarEnergiaComponent } from './comprar-energia/comprar-energia.component';
import { ConsumirEnergiaComponent } from './consumir-energia/consumir-energia.component';
import { ContratarComercializadorComponent } from './contratar-comercializador/contratar-comercializador.component';

@Component({
  selector: 'app-cliente-dashboard',
  templateUrl: './cliente-dashboard.component.html',
  styles: [
  ]
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {

  infoCliente: InfoContrato;
  tokensCliente: number = 0;
  cantidadEnergia: number = 0;


  constructor(private clienteService: ClienteContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private reguladorMercado: ReguladorMercadoService,
    private bancoEnergia: BancoEnergiaService,
    private certificado: CertificadorContractService,
    private ngZone: NgZone) { }

  ngOnDestroy(): void {
  }

  async ngOnInit(): Promise<void> {
    let dirContract = localStorage.getItem('dirContract');
    try {
      this.spinner.show();
      let promises: Promise<void>[] = []
      promises.push(this.reguladorMercado.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.clienteService.loadBlockChainContractData(dirContract));
      promises.push(this.certificado.loadBlockChainContractData(''));
      await Promise.all(promises);
      this.spinner.hide();
      this.getInfoContrato();
    } catch (error) {
      console.log(error);
      this.toastr.error("Error al cargar el contrato cliente", 'Error');
    }
  }

  getInfoContrato() {
    this.spinner.show();

    let observables: Observable<any>[] = [];
    observables.push(this.clienteService.getInfoContrato());
    observables.push(this.clienteService.getMisTokens());
    observables.push(this.clienteService.getEnergiaDisponible());

    forkJoin(observables).subscribe({
      next: (data) => {
        this.infoCliente = data[0];
        this.tokensCliente = data[1];
        this.cantidadEnergia = data[2];
        this.spinner.hide();
      }, error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    });
  }

  getTokensCliente(): Observable<number[]> {
    let observables: Observable<number>[] = [];
    observables.push(this.clienteService.getMisTokens());

    if (this.infoCliente.comercializador !== '0x0000000000000000000000000000000000000000') {
      observables.push(this.reguladorMercado.getTokensDelegados(this.infoCliente.comercializador, this.infoCliente.owner));
    }
    return forkJoin(observables)
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
    });
  }


  onVerCertificado() {
    this.dialog.open(InfoCertificadoAgenteComponent, {
      width: '791px',
      height: '671px',
      data: {
        dirContratoAgente: localStorage.getItem('dirContract'),
      }
    })
  }

  onConsumirEnergia() {
    let dialogRef = this.dialog.open(ConsumirEnergiaComponent, {
      width: '500px',
      data: {
        dirContrato: localStorage.getItem('dirContract'),
        cantidadesDisponibles: this.cantidadEnergia
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getCantidadesEnergiasDisponibles();
    })
  }

  getCantidadesEnergiasDisponibles() {
    this.spinner.show()
    this.clienteService.getEnergiaDisponible().subscribe({
      next: data => {
        this.cantidadEnergia = data
        this.spinner.hide();
      },
      error: error => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
        this.spinner.hide();
      }
    })
  }
}
