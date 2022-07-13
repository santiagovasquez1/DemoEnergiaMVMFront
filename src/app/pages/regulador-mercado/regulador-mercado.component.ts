import { GeneradorFactoryService } from './../../services/generador-factory.service';
import { ComercializadorFactoryService } from './../../services/comercializador-factory.service';
import { ClienteFactoryService } from './../../services/cliente-factory.service';
import { SweetAlertService } from './../../services/sweet-alert.service';
import { Observable, timer, Subscription, interval, switchMap } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { SolicitudContrato } from './../../models/solicitudContrato';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { ToastrService } from 'ngx-toastr';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

@Component({
  selector: 'app-regulador-mercado',
  templateUrl: './regulador-mercado.component.html',
  styles: [
  ]
})
export class ReguladorMercadoComponent implements OnInit, OnDestroy {
  solicitudesRegistro: SolicitudContrato[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  contadorAnterior = 0;
  contadorActual = 0;
  diligenciandoSolicitud: boolean = false;
  isFromInit: boolean = false;

  constructor(private toastr: ToastrService,
    private regulardorMercado: ReguladorMercadoService,
    private spinner: NgxSpinnerService,
    private sweetAlert: SweetAlertService,
    private clienteFactory: ClienteFactoryService,
    private comercializadorFactory: ComercializadorFactoryService,
    private generadorFactory: GeneradorFactoryService) {
    this.timer$ = timer(0, 1000);
  }
  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    this.isFromInit = true;
    this.spinner.show();
    await this.regulardorMercado.loadBlockChainContractData();
    console.log('opciones',this.regulardorMercado.contract.options)
    this.spinner.hide();
    this.timerSubscription = this.timer$.subscribe(() => {
      this.regulardorMercado.getSolicitudesRegistro().subscribe({
        next: (data) => {
          this.contadorActual = data.length;
          if (this.contadorActual !== this.contadorAnterior && !this.diligenciandoSolicitud) {
            this.solicitudesRegistro = data;
            if (this.contadorActual > this.contadorAnterior && !this.isFromInit) {
              this.toastr.success('Nueva solicitud de registro', 'Registro');
            }
            this.contadorAnterior = this.contadorActual;
          }
        }, error: (err) => {
          console.log(err);
          this.toastr.error(err.message, 'Error');
        }
      });
    })
  }

  onDiligenciarSolicitud(index: number, solicitud: SolicitudContrato) {
    this.diligenciandoSolicitud = true;
    this.sweetAlert.confirmAlert('Diligenciar solicitud', '¿Está seguro de diligenciar la solicitud?')
      .then(async (result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          switch (parseInt(solicitud.tipoContrato.toString())) {
            case TiposContratos.Cliente:
              await this.clienteFactory.loadBlockChainContractData();
              this.clienteFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success('Solicitud diligenciada', 'Registro');
                }, error: (err) => {
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, 'Error');
                }
              });
              break;
            case TiposContratos.Comercializador:
              await this.comercializadorFactory.loadBlockChainContractData();
              this.comercializadorFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success('Solicitud diligenciada', 'Registro');
                }, error: (err) => {
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, 'Error');
                }
              });
              break;
            case TiposContratos.Generador:
              await this.generadorFactory.loadBlockChainContractData();
              this.generadorFactory.setFactoryContrato(solicitud.infoContrato).subscribe({
                next: () => {
                  this.spinner.hide();
                  this.toastr.success('Solicitud diligenciada', 'Registro');
                }, error: (err) => {
                  console.log(err);
                  this.spinner.hide();
                  this.toastr.error(err.message, 'Error');
                }
              });
              break;
            default:
              this.spinner.hide();
              this.toastr.error('Tipo de contrato no soportado', 'Error');
          }
        }

        this.diligenciandoSolicitud = false;
      })
      .catch((err) => {
        this.toastr.error(err.message, 'Error');
        this.diligenciandoSolicitud = false;
      })
  }
}
