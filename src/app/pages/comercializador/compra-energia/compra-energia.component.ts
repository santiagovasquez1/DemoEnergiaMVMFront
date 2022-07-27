import { ComercializadorContractService } from 'src/app/services/comercializador-contract.service';
import { SweetAlertService } from './../../../services/sweet-alert.service';
import { forkJoin, Observable } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { SolicitudContrato } from './../../../models/solicitudContrato';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { InfoContrato } from './../../../models/infoContrato';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { InfoEmisionCompra } from 'src/app/models/InfoEmisionCompra';
import { WinRefService } from 'src/app/services/win-ref.service';
import { Web3ConnectService } from 'src/app/services/web3-connect.service';
import { CompraEnergiaRequest } from 'src/app/models/CompraEnergiaRequest';

@Component({
  selector: 'app-compra-energia',
  templateUrl: './compra-energia.component.html',
  styles: [
  ]
})
export class CompraEnergiaComponent implements OnInit {
  dirContract:string
  generadoresDisponibles: InfoContrato[] = [];
  cantidadEnergiasDisponibles: number[] = [];
  energiaAComprar: number[] = [];
  generadoresContracts: GeneradorContractService[] = [];
  emision: InfoEmisionCompra;
  index: number;

  constructor(public dialogRef: MatDialogRef<CompraEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public winRef: WinRefService,
    public web3Connect: Web3ConnectService,
    private alert: SweetAlertService,
    private comercializador:ComercializadorContractService) {
    this.emision = data.emision;
    this.index = data.index;
    this.dirContract = data.dirContract;
  }

  async ngOnInit(): Promise<void> {
    await this.reguladorMercado.loadBlockChainContractData();
    await this.comercializador.loadBlockChainContractData(this.dirContract);
    this.spinner.show();
    this.reguladorMercado.getContratosRegistrados().subscribe({
      next: (data: SolicitudContrato[]) => {
        this.generadoresDisponibles = data.filter(solicitud => solicitud.tipoContrato == TiposContratos.Generador).map(solicitud => {
          return solicitud.infoContrato;
        });
        let observables: Observable<number>[] = [];
        let promises: Promise<void>[] = [];
        this.generadoresDisponibles.forEach(generador => {
          this.generadoresContracts.push(new GeneradorContractService(this.winRef, this.web3Connect, this.toastr));
          promises.push(this.generadoresContracts[this.generadoresContracts.length - 1].loadBlockChainContractData(generador.dirContrato));
        });
        Promise.all(promises).then((response: void[]) => {
          for (let i = 0; i < response.length; i++) {
            observables.push(this.generadoresContracts[i].getCantidadEnergia(this.emision.tipoEnergia));
          }
          forkJoin(observables).subscribe({
            next: (data: number[]) => {
              this.cantidadEnergiasDisponibles = data;
              this.energiaAComprar = new Array(this.generadoresDisponibles.length).fill(0);
              this.spinner.hide();
            }, error: (err) => {
              console.log(err);
              this.toastr.error('Error al cargar la información del contrato', 'Error');
              this.spinner.hide();
            }
          });
        })
      }, error: error => {
        this.spinner.hide();
        this.toastr.error(error.message, 'Error');
      }
    })
  }

  onAumentarCantidad(index: number): void {
    this.energiaAComprar[index]++;
  }

  onDisminuirCantidad(index: number): void {
    if (this.energiaAComprar[index] > 0) {
      this.energiaAComprar[index]--;
    }
  }

  onComprarEnergia(): void {
    let observables: Observable<any>[] = [];
    this.alert.confirmAlert('Confirmación', '¿Está seguro de que desea comprar esta energía?')
      .then(result => {
        if (result.isConfirmed) {
          this.energiaAComprar.forEach((cantidad, index) => {
            if (cantidad > 0) {
              let compraRequest : CompraEnergiaRequest = {
                ownerCliente: this.emision.ownerCliente,
                dirContratoGenerador: this.generadoresDisponibles[index].dirContrato,
                cantidadEnergia: cantidad,
                tipoEnergia: this.emision.tipoEnergia,
                index: this.emision.index
              }
              observables.push(this.comercializador.ComprarEnergia(compraRequest));
            }
          });
          this.spinner.show();
          forkJoin(observables).subscribe({
            next: (data: any[]) => {
              this.toastr.success('Energía comprada con éxito', 'Éxito');
              this.spinner.hide();
              this.dialogRef.close();              
            },error: (err) => {
              console.log(err);
              this.toastr.error('Error al comprar la energía', 'Error');
              this.spinner.hide();
              this.dialogRef.close();
            }
          })
        }
      })
  }
}
