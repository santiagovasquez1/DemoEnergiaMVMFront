import { PlantaEnergiaService } from './../../../services/planta-energia.service';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { BancoEnergiaService } from './../../../services/banco-energia.service';
import { NuevaEnergiaComponent, Estado } from './../nueva-energia/nueva-energia.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { InfoPlantaEnergia } from './../../../models/InfoPlantaEnergia';
import { Component, OnInit } from '@angular/core';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { Observable, forkJoin } from 'rxjs';
import { WinRefService } from 'src/app/services/win-ref.service';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';

@Component({
  selector: 'app-lista-plantas',
  templateUrl: './lista-plantas.component.html',
  styles: [
  ]
})
export class ListaPlantasComponent implements OnInit {

  plantasDeEnergia: InfoPlantaEnergia[] = [];
  dirContract: string;
  energiasDisponibles: string[] = [];

  constructor(
    private generadorService: GeneradorContractService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private bancoEnergia: BancoEnergiaService,
    private winRef: WinRefService,
    private web3Connect: Web3ConnectService) { }

  async ngOnInit(): Promise<void> {
    try {
      this.dirContract = localStorage.getItem('dirContract');
      let promises: Promise<void>[] = [];

      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.generadorService.loadBlockChainContractData(this.dirContract));
      await Promise.all(promises);
      this.loadInfoGeneral();
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar las plantas de energía', 'Error');
    }
  }

  loadInfoGeneral() {
    this.spinner.show();
    let observables: Observable<any>[] = [];
    observables.push(this.bancoEnergia.getTiposEnergiasDisponibles());
    observables.push(this.generadorService.getPlantasEnergia());

    forkJoin(observables).subscribe({
      next: async (data: any[]) => {
        const tiposEnergias = data[0];
        this.energiasDisponibles = tiposEnergias.map(tipo => tipo.nombre);
        this.plantasDeEnergia = data[1];
        this.spinner.hide();
      },
      error: (err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error');
        this.spinner.hide();
      }
    });

  }

  onInyectarEnergia(hashPlanta: string) {
    let dialogRef = this.dialog.open(NuevaEnergiaComponent, {
      width: '500px',
      data: {
        dirContract: this.dirContract,
        hashPlanta: hashPlanta,
        energiasDisponibles: this.energiasDisponibles,
        estado: Estado.inyectarEnergia
      }
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        this.loadInfoGeneral();
      }
    });
  }
}
