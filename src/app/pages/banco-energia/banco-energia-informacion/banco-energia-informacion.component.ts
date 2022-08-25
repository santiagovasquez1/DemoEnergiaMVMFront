import { Observable, Subscription, timer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InfoEnergia } from 'src/app/models/InfoEnergia';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';

@Component({
  selector: 'app-banco-energia-informacion',
  templateUrl: './banco-energia-informacion.component.html'
})
export class BancoEnergiaInformacionComponent implements OnInit, OnDestroy {

  energiasDisponibles: InfoEnergia[] = [];
  energiaChangeEvent: any
  timer$: Observable<any>;
  timerSubscription: Subscription;

  constructor(private bancoEnergia: BancoEnergiaService,
    private toastr: ToastrService) {
    this.timer$ = timer(0, 1000);
  }

  async ngOnInit(): Promise<void> {
    try {
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      await Promise.all(promises);
      this.timerSubscription = this.timer$.subscribe(()=>{
        this.setCantidadEnergiaInfo();
      })

    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

  ngOnDestroy(): void {
    //this.energiaChangeEvent.removeAllListeners('data');
    this.timerSubscription.unsubscribe();
  }

  private setCantidadEnergiaInfo() {
    this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
      next: (data) => {
        this.energiasDisponibles = data;
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    });
  }

}
