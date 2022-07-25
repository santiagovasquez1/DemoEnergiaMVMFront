import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { InfoContrato } from 'src/app/models/infoContrato';
import { ClienteContractService } from 'src/app/services/cliente-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

@Component({
  selector: 'app-contratar-comercializador',
  templateUrl: './contratar-comercializador.component.html'
})
export class ContratarComercializadorComponent implements OnInit {

  comercializadores: InfoContrato[] = [];
  comercializadorSeleccionado: InfoContrato = null;
  constructor(public dialogRef: MatDialogRef<ContratarComercializadorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private reguladorMercado: ReguladorMercadoService,
              private alertDialog: SweetAlertService,
              private spinner: NgxSpinnerService,
              private clienteService: ClienteContractService,
              private toastr: ToastrService) { }

  async ngOnInit(): Promise<void> {
  }

}
