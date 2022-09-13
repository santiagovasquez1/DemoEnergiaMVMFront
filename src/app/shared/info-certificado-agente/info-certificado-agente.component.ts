import { forkJoin } from 'rxjs';
import { InfoContrato } from 'src/app/models/infoContrato';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { CertificadorContractService } from './../../services/certificador-contract.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InfoCertificadoAgente } from 'src/app/models/InfoCertificados';

@Component({
  selector: 'app-info-certificado-agente',
  templateUrl: './info-certificado-agente.component.html',
  styles: [
  ]
})
export class InfoCertificadoAgenteComponent implements OnInit {

  infoCertificador: InfoContrato;
  infoCertificadoAgente: InfoCertificadoAgente;
  dirContratoAgente: string;

  constructor(public dialogRef: MatDialogRef<InfoCertificadoAgenteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private certificador: CertificadorContractService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService) {
    this.dirContratoAgente = data.dirContratoAgente;
  }

  async ngOnInit() {
    try {
      await this.certificador.loadBlockChainContractData('');
      this.spinner.show();

      forkJoin([this.certificador.getInfoContrato(),
      this.certificador.getCertificadoAgente(this.dirContratoAgente)]).subscribe(
        {
          next: (data) => {
            this.infoCertificador = data[0] as InfoContrato;
            this.infoCertificadoAgente = data[1] as InfoCertificadoAgente
            this.spinner.hide()
          },
          error: (error) => {
            console.log(error);
            this.spinner.hide();
            this.toastr.error('Error al obtener el certificado del agente', 'Error');
            this.dialogRef.close();
          }
        }
      )
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
      this.dialogRef.close();
    }
  }

}
