import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, forkJoin } from 'rxjs';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { InfoContrato } from 'src/app/models/infoContrato'
import { MatDialog } from '@angular/material/dialog';
import { NuevaEnergiaComponent } from './nueva-energia/nueva-energia.component';
import { InyectarEnergiaComponent } from './inyectar-energia/inyectar-energia.component';
import { ContratarComercializadorGComponent } from './contratar-comercializador-g/contratar-comercializador-g.component';

@Component({
  selector: 'app-generador',
  templateUrl: './generador.component.html'
})
export class GeneradorComponent implements OnInit {

  account: string;
  infoContrato: InfoContrato = {} as InfoContrato;
  dirContract: string;
  energiasDisponibles: string[] = [];
  cantidadesDisponibles: number[] = [];
  tokensGenerador: number = 0;

  constructor(
    private toastr: ToastrService,
    private generadorService: GeneradorContractService,
    private spinnerService: NgxSpinnerService,
    private regulardorMercado: ReguladorMercadoService,
    private bancoEnergia: BancoEnergiaService,
    public dialog: MatDialog) {

  }

  async ngOnInit(): Promise<void> {

    this.dirContract = localStorage.getItem('dirContract');
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.regulardorMercado.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.generadorService.loadBlockChainContractData(this.dirContract));
      await Promise.all(promises);
      this.generadorService.contract.events.compraEnergia({
        froBlock: 'latest',
      }, (error, event) => {
        if (error) {
          console.log(error);
          this.toastr.error(error.message, 'Error');
        } else {
          this.loadContractInfo();
        }
      });
      this.loadContractInfo();

    }
    catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar el contrato', 'Error');
    }
  }

  private loadContractInfo() {
    let observables: Observable<any>[] = [];
    observables.push(this.generadorService.getInfoContrato());
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles());
    observables.push(this.generadorService.getMisTokens());

    this.spinnerService.show();
    forkJoin(observables).subscribe({
      next: (data: any[]) => {
        this.infoContrato = data[0] as InfoContrato;
        const tiposEnergias = data[1] as InfoEnergia[];
        this.tokensGenerador = data[2] as number;
        this.energiasDisponibles = tiposEnergias.map(x => x.nombre);
        this.getCantidadesEnergiasDisponibles();
      }, error: (error) => {
        this.spinnerService.hide();
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  private getCantidadesEnergiasDisponibles() {
    let observablesEnergias: Observable<any>[] = [];
    this.energiasDisponibles.forEach(energia => {
      observablesEnergias.push(this.generadorService.getCantidadEnergia(energia));
    });
    forkJoin(observablesEnergias).subscribe({
      next: (data: number[]) => {
        this.cantidadesDisponibles = data;
        this.spinnerService.hide();
      }, error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
        this.spinnerService.hide();
      }
    });
  }

  onNuevaEnergia() {
    let dialog = this.dialog.open(NuevaEnergiaComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        energiasDisponibles: this.energiasDisponibles,
        estado: Estado.nuevaEnergia
      }
    });

    dialog.afterClosed().subscribe(result => {
      this.spinnerService.show();
      this.getCantidadesEnergiasDisponibles();
    });
  }

  onInyectarEnergia() {
    let dialog = this.dialog.open(NuevaEnergiaComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        energiasDisponibles: this.energiasDisponibles,
        estado: Estado.inyectarEnergia
      }
    });
    dialog.afterClosed().subscribe(result => {
      this.spinnerService.show();
      this.getCantidadesEnergiasDisponibles();
    });
  }

  onContratarComerciliazador(){
    this.dialog.open(ContratarComercializadorGComponent, {
    width: '500px'
    });
  }
    
  

}
