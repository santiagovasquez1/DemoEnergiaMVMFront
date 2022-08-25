import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';

@Component({
  selector: 'app-banco-energia-informacion',
  templateUrl: './banco-energia-informacion.component.html'
})
export class BancoEnergiaInformacionComponent implements OnInit {

  energiasDisponibles: InfoEnergia[] = [];
  
  constructor(private bancoEnergia: BancoEnergiaService) {}

  
  async ngOnInit(): Promise<void> {
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      //promises.push(this.bancoEnergia.loadBlockChainContractData());
      await Promise.all(promises);

      this.setCantidadEnergiaInfo();

    } catch (error) {
      console.log(error);

    }
  }

  private setCantidadEnergiaInfo() {
    this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
      next: (data) => {

        this.energiasDisponibles = data;
        console.log("energias disponibles: ",data);

      },
      error: (error) => {
        console.log(error);
      }
    });
  }

}
