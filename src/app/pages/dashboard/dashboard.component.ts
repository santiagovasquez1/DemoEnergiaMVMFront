import { Observable, forkJoin } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit } from '@angular/core';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  numTokensDisponibles: number = 0;
  solicutudesRegistro: any[] = [];

  constructor(private reguladorService: ReguladorMercadoService,
    private toastr: ToastrService,
    private spinnerService: NgxSpinnerService) { }

  async ngOnInit() {
    try {
      this.spinnerService.show();
      await this.reguladorService.loadBlockChainContractData();
      let observables: Observable<any>[] = [];
      observables.push(this.reguladorService.getTokensDisponibles());
      observables.push(this.reguladorService.getSolicitudesRegistro());

      forkJoin(observables).subscribe({
        next: (data) => {
          this.numTokensDisponibles = data[0];
          this.solicutudesRegistro = data[1];
          console.log(this.numTokensDisponibles);
          console.log(this.solicutudesRegistro);
          this.spinnerService.hide();
        },error: (err) => {
          this.spinnerService.hide();
          this.toastr.error(err.message, 'Error');
        }
      });
    }
    catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar el contrato', 'Error');
      this.spinnerService.hide();
    }
  }

}
