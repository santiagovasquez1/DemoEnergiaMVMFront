import { StringMap } from '@angular/compiler/src/compiler_facade_interface';
import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { AgenteContractService } from 'src/app/services/agente-contract.service';
import { FactoryService } from 'src/app/services/factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import {InfoContrato} from 'src/app/models/infoContrato'
import { MatDialog } from '@angular/material/dialog';
import { NuevaEnergiaComponent } from './nueva-energia/nueva-energia.component';
import { InyectarEnergiaComponent } from './inyectar-energia/inyectar-energia.component';
import { ContratarComercializadorGComponent } from './contratar-comercializador-g/contratar-comercializador-g.component';

@Component({
  selector: 'app-generador',
  templateUrl: './generador.component.html'
})
export class GeneradorComponent implements OnInit {
  
  generadores: string[] = [];
  dirContratos: string[] = [];
  dirGeneradores: string[] = [];
  registros: SolicitudContrato[] = [];
  message: string;
  timer$: Observable<any>;
  timerSubscription: Subscription;
  account: string;
  infoGenerador: SolicitudContrato = {} as SolicitudContrato;
  infoContrato: InfoContrato = {} as InfoContrato;

  constructor(
    private toastr: ToastrService,
    private generadorService: GeneradorFactoryService,
    private spinnerService: NgxSpinnerService,
    private regulardorMercado: ReguladorMercadoService,
    private  agenteService: AgenteContractService,
    public dialog: MatDialog ) { 
    this.timer$ = timer(0, 1000);
  }

  async ngOnInit(): Promise<void> {
    
    this.account = localStorage.getItem('account');
    try {
        await this.generadorService.loadBlockChainContractData();

        //this.timerSubscription = this.timer$.subscribe(() => {
          this.regulardorMercado.getContratosRegistrados().subscribe({
          next: data => {
            this.registros = data;
            console.log(data);
            this.dataGenerador();
          },
          error: err => {
            console.log(err);
            this.toastr.error('Error al cargar los generadores', 'Error');
          }
        });
      //});
      }
      catch (error) {
        console.log(error);
        this.toastr.error('Error al cargar el contrato', 'Error');
      }
      
      this.agenteService.getInfoContrato().subscribe({
        next: data => {
          console.log("AGENTE SERVICE: ",this.infoContrato);
          this.infoContrato = data;
          console.log("AGENTE SERVICE: ",this.infoContrato);
        },
        error: err => {
          console.log(err);
        }
      })
      

  }

  dataGenerador(): void {
    //this.registros.filter();
    this.infoGenerador = this.registros.find(element => element.infoContrato.owner == this.account)
    console.log(this.infoGenerador.infoContrato);
  }

  onNuevaEnergia() {
    this.dialog.open(NuevaEnergiaComponent, {
      width: '500px'
    });
  }

  onInyectarEnergia(){
    this.dialog.open(InyectarEnergiaComponent, {
      width: '500px'
    });
  }

  onContratarComerciliazador(){
    this.dialog.open(ContratarComercializadorGComponent, {
    width: '500px'
    });
  }
    
  

}
