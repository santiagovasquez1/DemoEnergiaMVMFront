import { InfoTx, TipoTx } from './../../models/InfoTx';
import { ReguladorMercadoService } from './../../services/regulador-mercado.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ToastrService } from 'ngx-toastr';
import { InfoEnergia } from './../../models/InfoEnergia';
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, ElementRef, ViewChildren, QueryList, NgZone } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { ChartData, ChartEvent, ChartType, Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { default as Annotation } from 'chartjs-plugin-annotation';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

import { extendMoment } from 'moment-range';
const moment = require('moment');
const momentExtended = extendMoment(moment);

import { forkJoin } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-banco-energia',
  templateUrl: './banco-energia.component.html',
  styles: [
  ]
})
export class BancoEnergiaComponent implements OnInit, OnDestroy, AfterViewInit {
  private languageSubs: Subscription;

  energiasDisponibles: InfoEnergia[] = [];
  isFromInit: boolean = false;
  contadorAnterior: number = 0;
  contadorActual: number = 0;

  estadoAnterior: InfoEnergia[] = [];
  estadoActual: InfoEnergia[] = [];

  //Eventos
  private eventoTransaccion: any;
  private CambioDeEnergiaEvent: any;
  private SolicitudDeRegistroEvent: any;

  // Doughnut
  public doughnutChartLabels: string[]
  public doughnutChartData: ChartData<'doughnut'>
  public doughnutChartType: ChartType = 'doughnut';
  public pieChartOptions: ChartOptions = {
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14,
            family: 'Montserrat'
          }
        }
      }
    }
  };

  months?: string[]



  //START LINE CHART
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40, 70, 90, 100, 270, 150],
        label: 'Solar',
        backgroundColor: 'rgba(76, 156, 46, 0.2)',
        borderColor: 'rgba(76, 156, 46, 1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        fill: 'origin',

      },
      {
        data: [75, 39, 90, 91, 66, 55, 40, 70, 90, 10, 70, 40],
        label: 'Eólica',
        backgroundColor: 'rgba(194, 213, 0, 0.2)',
        borderColor: 'rgba(194, 213, 0, 1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        fill: 'origin',
      }

    ],
    labels: this.months
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.5,

      }

    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.

      x: {
        grid: {
          //display: false
        },

        ticks: {
          autoSkip: true
        },
        /*
        title:{
          display: true,
          text: 'Meses'
        }*/
      },
      y:
      {
        beginAtZero: true,
        grid: {
          //display: false
        },
        position: 'left',
        title: {
          display: true,
          text: '$/MWh'
        },
        ticks: {
          autoSkip: true
        },
      }
    },

    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14,
            family: 'Montserrat'
          }
        }
      }
    }
  };

  public lineChartType: ChartType = 'line';

  public pieChartData: ChartData<'pie'>
  public pieChartType: ChartType = 'pie';

  graphTitleY?: string;
  // FIN PIE CHART

  // INICIO BAR-CHART
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    // We use these empty structures as placeholders for dynamic theming.
    scales: {
      x: {},
      y: {
        title: {
          display: true,
          text: this.graphTitleY
        },
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: {
            size: 14,
            family: 'Montserrat'
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'end'
      }
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'>;

  // @ViewChild('cantidadEnergia', { static: true }) cantidadEnergiaChart: BaseChartDirective;
  @ViewChildren(BaseChartDirective) charts: QueryList<BaseChartDirective>
  showChart: boolean = false;

  constructor(private toastr: ToastrService,
    private bancoEnergia: BancoEnergiaService,
    private reguladorMercado: ReguladorMercadoService,
    private spinner: NgxSpinnerService,
    private ngZone: NgZone,
    private languageService: LanguageService) {
    Chart.register(Annotation)
  }

  ngAfterViewInit(): void {
    console.log(this.charts);
  }

  ngOnDestroy(): void {
    this.eventoTransaccion.removeAllListeners('data');
    this.SolicitudDeRegistroEvent.removeAllListeners('data');
    this.CambioDeEnergiaEvent.removeAllListeners('data');
  }

  setTranslations(){
    
  }


  initializeTranslations(){
    forkJoin([
      // this.languageService.get('Analisis de consumo'),
      // this.languageService.get('Factor de planta'),
      // this.languageService.get('Consumo energía y potencia'),
      // this.languageService.get(['Potencia activa', 'Potencia reactiva', 'Energía activa', 'Energía reactiva']),
      // this.languageService.get(['Año', 'Mes', 'Dia'])
      // ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      this.languageService.get('Cantidad de Mwh por transacciones'),
      this.languageService.get(['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre','Octubre', 'Noviembre', 'Diciembre'])
    ]).subscribe({
      next: translatedTexts => {
        console.log('translatedTexts: ', translatedTexts);
        this.graphTitleY = translatedTexts[0];
        this.months = translatedTexts[1];
        // console.log('translatedTexts: ', translatedTexts);
        // this.title = translatedTexts[0];
        // this.subtitle1 = translatedTexts[1];
        // this.subtitle2 = translatedTexts[2];
        // this.arrayVariablesMed = Object.values(translatedTexts[3]);
        // this.arrayPeriodosMed = Object.values(translatedTexts[4]);
        // this.setSelectVariablesMed('---', this.arrayVariablesMed, this.selectedVariablesMed, false);
        // this.setSelectPeriodosMed('---', this.arrayPeriodosMed, this.selectedPeriodosMed, false);
      },
      error: err => {
        console.log(err);
      }
    })
  }

  async ngOnInit(): Promise<void> {
    try {
      this.languageSubs = this.languageService.language.subscribe({
        next: language => {
          this.initializeTranslations();
          console.log('language: ', language);
        },
        error: err => {
          console.log(err);
        }
      })

      this.isFromInit = true;
      this.spinner.show();
      let promises: Promise<void>[] = [];
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      promises.push(this.bancoEnergia.loadBlockChainContractData());
      await Promise.all(promises);

      this.setEvents();
      this.setDoughnutInfo();
      this.setCantidadEnergiaInfo();
      this.setTransactionsInfo();

      this.spinner.hide();
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }


  private setEvents() {
    this.eventoTransaccion = this.bancoEnergia.contract.events.eventoTransaccion({
      fromBlock: 'latest'
    }, (error, event) => {
      if (error) {
        console.log(error);
      }
    }).on('data', (event) => {
      this.ngZone.run(()=>{
        this.setTransactionsInfo();
      })
    });

    this.SolicitudDeRegistroEvent = this.reguladorMercado.contract.events.ContratoDiligenciado({
      fromBlock: 'latest'
    }).on('data', (event) => {
      this.ngZone.run(() => {
        this.setDoughnutInfo();
      });
    });

    this.CambioDeEnergiaEvent = this.bancoEnergia.contract.events.cambioDeEnergia({
      fromBlock: 'latest'
    }).on('data', (event) => {
      this.ngZone.run(() => {
        this.setCantidadEnergiaInfo();
      });
    });

  }

  private setDoughnutInfo() {
    this.reguladorMercado.getContratosRegistrados().subscribe({
      next: (data) => {
        this.doughnutChartLabels = this.getDoughnutLabes(data);
        this.doughnutChartData = {
          labels: this.doughnutChartLabels,
          datasets: [{
            data: this.getDoughnutData(data, this.doughnutChartLabels),
            backgroundColor: ['#4C9C2E', '#C2D500', 'rgba(146, 146, 146, 1)'],
            hoverBackgroundColor: ['#4C9C2E', '#C2D500', 'rgba(146, 146, 146, 1)'],
            hoverBorderColor: ['#4C9C2E', '#C2D500', 'rgba(146, 146, 146, 1)'],
          }]
        };

        this.showChart = true;
      }
    });
  }

  private getDoughnutLabes(data: SolicitudContrato[]) {
    const uniqueLabels = data.map(item => {
      switch (item.tipoContrato) {
        case TiposContratos.Cliente:
          return 'Cliente';
        case TiposContratos.Comercializador:
          return 'Comercializador';
        case TiposContratos.Generador:
          return 'Generador';
        default:
          return 'No definido';
      }
    }).filter((value, index, self) => self.indexOf(value) === index);
    return uniqueLabels;
  }

  private getDoughnutData(data: SolicitudContrato[], labels: string[]) {

    let tempChartData: number[] = [];

    labels.forEach(label => {
      const numberElements = data.filter(item => {
        let tipo: string = '';
        switch (item.tipoContrato) {
          case TiposContratos.Cliente:
            tipo = 'Cliente';
            break;
          case TiposContratos.Comercializador:
            tipo = 'Comercializador';
            break;
          case TiposContratos.Generador:
            tipo = 'Generador';
            break;
          default:
            tipo = 'No definido';
            break;
        }
        return tipo === label;
      }).length;
      tempChartData.push(numberElements);
    })
    return tempChartData;
  }

  private setCantidadEnergiaInfo() {
    this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
      next: (data) => {

        this.energiasDisponibles = data;
        console.log("energias disponibles: ", data);
        this.pieChartData = {
          labels: this.getPieChartLabels(data),
          datasets: [{
            data: this.getPieChartDataValues(data, this.getPieChartLabels(data)),
            backgroundColor: ['#4C9C2E', '#C2D500'],
            hoverBackgroundColor: ['#4C9C2E', '#C2D500'],
            hoverBorderColor: ['#4C9C2E', '#C2D500']
          }]
        }

        this.charts.find(item => item.type === 'pie').update();
      },
      error: (error) => {
        console.log(error);
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  private getPieChartLabels(data: InfoEnergia[]) {
    const uniqueLabels = data.map(item => item.nombre).filter((value, index, self) => self.indexOf(value) === index);
    return uniqueLabels;
  }

  private getPieChartDataValues(data: InfoEnergia[], labels: string[]) {

    let tempChartData: number[] = [];

    labels.forEach(label => {
      const cantidadEnergia = data.filter(item => item.nombre === label)[0].cantidadEnergia;
      tempChartData.push(cantidadEnergia);
    })
    return tempChartData;
  }

  private setTransactionsInfo() {
    this.bancoEnergia.getInfoTxs().subscribe({
      next: (data) => {
        const labels = this.getBarChartLables(data);
        const datasets = this.getBarChartDatasets(data, labels);
        console.log(datasets);
        this.barChartData = {
          labels,
          datasets
        }
      }
    });
  }

  private getBarChartLables(data: InfoTx[]): string[] {
    const startDate = moment(data[0].fechaTx, 'DD/MM/YYYY');
    const endDate = moment(data[data.length - 1].fechaTx, 'DD/MM/YYYY');
    const range = momentExtended.range(startDate, endDate);
    const days = Array.from(range.by('day'));
    return days.map(day => day.format('DD/MM/YYYY'));
  }

  private getBarChartDatasets(data: InfoTx[], labels: string[]) {
    const transactionsTypes: TipoTx[] = Object.values(TipoTx).filter(
      (value) => typeof value === 'number'
    ) as TipoTx[];


    const dataSets = transactionsTypes.map(tipo => {
      const energiasPorDia = labels.map(label => {
        const tempMomentDay = moment(label, 'DD/MM/YYYY');
        const cantidadEnergiaPorDia = data
          .filter(item => item.tipoTx === tipo && moment(item.fechaTx, 'DD/MM/YYYY').isSame(tempMomentDay, 'day'))
          .map(item => item.cantidadEnergia)
          .reduce((acc, curr) => acc + curr, 0);
        return cantidadEnergiaPorDia;
      })
      let dataSetItemLabel = '';
      let backgroundColor = [];
      switch (tipo) {
        case TipoTx.consumo:
          dataSetItemLabel = 'Consumo';
          backgroundColor = ['#C2D500'];
          break;
        case TipoTx.inyeccion:
          dataSetItemLabel = 'Inyección';
          backgroundColor = ['#8FD380']
          break;
        case TipoTx.venta:
          dataSetItemLabel = 'Venta';
          backgroundColor = ['#4C9C2E']
          break;
        case TipoTx.emision:
          dataSetItemLabel = 'Emisión';
          backgroundColor = ['#929292']
          break;
      }
      return {
        data: energiasPorDia,
        label: dataSetItemLabel,
        backgroundColor,
        hoverBackgroundColor: backgroundColor,
        hoverBorderColor: backgroundColor
      }
    })

    return dataSets;
  }
}
