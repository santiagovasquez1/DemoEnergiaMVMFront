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

  constructor(private reguladorService: ReguladorMercadoService,
    private toastr: ToastrService,
    private spinnerService:NgxSpinnerService) { }

  async ngOnInit() {
    //this.web3Service.initContract();
    try {
      this.spinnerService.show();
      await this.reguladorService.loadBlockChainContractData();
      this.reguladorService.getTokensDisponibles().subscribe({
        next: data => {
          console.log(data);
          this.spinnerService.hide();
        },
        error: err => {
          console.log(err);
          this.toastr.error('Error al obtener los tokens disponibles', 'Error');
          this.spinnerService.hide();
        }
      });
    }
    catch {
      console.log("Error al cargar el contrato");
      this.toastr.error('Error al cargar el contrato', 'Error');
      this.spinnerService.hide();
    }
  }

}
