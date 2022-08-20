import { NgxSpinnerService } from 'ngx-spinner';
import { BancoEnergiaService } from 'src/app/services/banco-energia.service';
import { ToastrService } from 'ngx-toastr';
import { InfoEnergia } from './../../models/InfoEnergia';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { ChartData, ChartEvent, ChartType, Chart, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { default as Annotation } from 'chartjs-plugin-annotation';

@Component({
  selector: 'app-banco-energia',
  templateUrl: './banco-energia.component.html',
  styles: [
  ]
})
export class BancoEnergiaComponent implements OnInit, OnDestroy {
  energiasDisponibles: InfoEnergia[] = [];
  timer$: Observable<any>;
  timerSubscription: Subscription;
  isFromInit: boolean = false;
  contadorAnterior: number = 0;
  contadorActual: number = 0;

  estadoAnterior: InfoEnergia[] = [];
  estadoActual: InfoEnergia[] = [];
  eventoTransaccion: any;

  // Doughnut
  public doughnutChartLabels: string[] = ['Generadores', 'Clientes', 'Comercializadores'];
  public doughnutChartData: ChartData<'doughnut'> = {
    //labels: this.doughnutChartLabels,
    datasets: [{
      data: [350, 450, 100],
      backgroundColor: ['#4C9C2E', '#C2D500', 'rgba(146, 146, 146, 1)'],
      hoverBackgroundColor: ['#4C9C2E', '#C2D500', 'rgba(146, 146, 146, 1)'],
      hoverBorderColor: ['#4C9C2E', '#C2D500', 'rgba(146, 146, 146, 1)']
    }
    ]
  };
  public doughnutChartType: ChartType = 'doughnut';

  // events
  public chartClicked({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }

  constructor(private toastr: ToastrService,
    private bancoEnergia: BancoEnergiaService,
    private spinner: NgxSpinnerService) {
    this.timer$ = timer(0, 1000);
    Chart.register(Annotation)
  }

  ngOnDestroy(): void {
    this.eventoTransaccion.removeAllListeners('data');
    this.timerSubscription.unsubscribe();
  }

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
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
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
      legend: { display: true },
    }
  };

  public lineChartType: ChartType = 'line';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  // FIN LINE CHART


  // INICIO PIE CHART
  // Pie
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      datalabels: {
        formatter: (value, ctx) => {
          if (ctx.chart.data.labels) {
            return ctx.chart.data.labels[ctx.dataIndex];
          }
        },
      },
    }
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    //labels: [ 'Solar', 'Eólica' ],
    datasets: [{
      data: [300, 500],
      backgroundColor: ['#4C9C2E', '#C2D500'],
      hoverBackgroundColor: ['#4C9C2E', '#C2D500'],
      hoverBorderColor: ['#4C9C2E', '#C2D500']

    }]
  };
  public pieChartType: ChartType = 'pie';

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
          text: 'Cantidad de transacciones'
        },
      }
    },
    plugins: {
      legend: {
        display: true,
      },
      datalabels: {
        anchor: 'end',
        align: 'end'
      }
    }
  };
  public barChartType: ChartType = 'bar';


  public barChartData: ChartData<'bar'> = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40, 80, 81, 56, 55, 40],
        label: 'Compra',
        backgroundColor: ['#4C9C2E'],
        hoverBackgroundColor: ['#4C9C2E'],
        hoverBorderColor: ['#4C9C2E']
      },
      {
        data: [28, 48, 40, 19, 86, 27, 28, 48, 40, 19, 86, 20],
        label: 'Venta',
        backgroundColor: ['rgba(194, 213, 0, 1)'],
        hoverBackgroundColor: ['rgba(194, 213, 0, 1)'],
        hoverBorderColor: ['rgba(194, 213, 0, 1)']
      },
      {
        data: [28, 48, 40, 19, 86, 27, 34, 56, 21, 40, 50, 30],
        label: 'Carga',
        backgroundColor: ['rgba(143, 211, 128, 1)'],
        hoverBackgroundColor: ['rgba(143, 211, 128, 1)'],
        hoverBorderColor: ['rgba(143, 211, 128, 1)']
      },

    ]
  };

  // FIN BAR-CHART
  async ngOnInit(): Promise<void> {
    try {
      this.isFromInit = true;
      this.spinner.show();
      await this.bancoEnergia.loadBlockChainContractData();
      this.eventoTransaccion = this.bancoEnergia.contract.events.eventoTransaccion({
        fromBlock: 'latest'
      }, (error, event) => {
        if (error) {
          console.log(error);
        }
      }).on('data', (event) => {
        console.log(event);
      });
      this.spinner.hide();

      this.timerSubscription = this.timer$.subscribe(() => {
        if (this.energiasDisponibles) {
          this.bancoEnergia.getTiposEnergiasDisponibles().subscribe({
            next: (data) => {
              this.contadorActual = data.length;
              if (this.contadorActual !== this.contadorAnterior) {
                this.energiasDisponibles = data;
                this.estadoActual = data;
                this.estadoAnterior = this.estadoActual;
                this.contadorAnterior = this.contadorActual;
              } else {
                for (let i = 0; i < data.length; i++) {
                  let flag: boolean = false;
                  if (this.estadoActual[i].nombre !== data[i].nombre) {
                    flag = true;
                  } else if (this.estadoActual[i].cantidadEnergia !== data[i].cantidadEnergia) {
                    flag = true;
                  } else if (this.estadoActual[i].precio !== data[i].precio) {
                    flag = true;
                  }
                  if (flag) {
                    this.energiasDisponibles = data;
                    this.estadoAnterior = this.estadoActual;
                  }
                }
              }
            },
            error: (err) => {
              console.log(err);
              this.toastr.error(err.message, 'Error');
            }
          });
        }
      })
    } catch (error) {
      console.log(error);
      this.toastr.error(error.message, 'Error');
    }
  }

}
