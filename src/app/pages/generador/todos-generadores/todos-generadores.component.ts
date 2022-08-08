import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer } from 'rxjs';
import { SolicitudContrato } from 'src/app/models/solicitudContrato';
import { FactoryService } from 'src/app/services/factory.service';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { Chart, ChartConfiguration, ChartEvent, ChartType,ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {default as Annotation} from '../../../../../node_modules/chartjs-plugin-annotation';

import DatalabelsPlugin from '../../../../../node_modules/chartjs-plugin-datalabels';
import { EthereumService } from 'src/app/services/dashboard/ethereum.service';


@Component({
  selector: 'app-todos-generadores',
  templateUrl: './todos-generadores.component.html'
})
export class TodosGeneradoresComponent implements OnInit {

  generadores: string[] = [];
  dirContratos: string[] = [];
  dirGeneradores: string[] = [];
  registros: SolicitudContrato[] = [];
  message: string;
  timer$: Observable<any>;
  timerSubscription: Subscription;
  account: string;
  infoGenerador: SolicitudContrato = {} as SolicitudContrato;
  todoGeneradores: SolicitudContrato[] = [];
  
  titlte = "titulo desde generadores";
  departamento;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  constructor(
    private toastr: ToastrService,
    private generadorService: GeneradorFactoryService,
    private regulardorMercado: ReguladorMercadoService,
    private ethereumService: EthereumService ) { 
    this.timer$ = timer(0, 1000);
  }

  async ngOnInit(): Promise<void> {
    
    /*
    this.account = localStorage.getItem('account');
    try {
        await this.generadorService.loadBlockChainContractData();
        //this.timerSubscription = this.timer$.subscribe(() => {
          this.regulardorMercado.getContratosRegistrados().subscribe({
          next: data => {
            this.registros = data;
            console.log(data);
            this.dataGenerador();
          },
          error: err => {
            console.log(err);
            this.toastr.error('Error al cargar los generadores', 'Error');
          }
        });
      //});
      }
      catch (error) {
        console.log(error);
        this.toastr.error('Error al cargar el contrato', 'Error');
      }
      */
  }

  ngAfterViewInit(): void{
    console.log("Todos generadores emitiendo: ",this.titlte);
    this.ethereumService.TriggerDataChartLine.emit({
      data: {
        datasets: [
          {
            data: [200],
            label: 'Precio ETH (usd)',
            backgroundColor: 'rgba(12,199,132,0.2)',
            borderColor: 'rgba(12,199,132,1)',
            pointBackgroundColor: 'rgba(12,199,132,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(12,199,132,0.8)',
            fill: 'origin',
          },
        ],
        labels: [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio','Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'  ]
      }
    })
  }

  dataGenerador(): void {
    //this.registros.filter();
    this.infoGenerador = this.registros.find(element => element.tipoContrato == 2)
    console.log(this.infoGenerador.infoContrato);

    this.registros.forEach(element => {
      if(element.tipoContrato == 2){
        this.todoGeneradores.push(element);
        console.log(this.todoGeneradores);
      } 
    });
    
  }

  //Gráfica
  addItem(newItem: string) {
    this.departamento = newItem;
    console.log("desde todos: ",this.departamento)
  }

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [ 650, 590, 1200, 1140, 1210, 1155, 1400,2065, 1900, 1800, 1750, 1896  ],
        label: 'Energía generada MW',
        backgroundColor: 'rgba(12,199,132,0.2)',
        borderColor: 'rgba(12,199,132,1)',
        pointBackgroundColor: 'rgba(12,199,132,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(12,199,132,0.8)',
        fill: 'origin',
      },
    ],
    labels: [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio','Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'  ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.1
      }
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      x: {},
      'y-axis-0':
        {
          position: 'left',
        }/*,
      'y-axis-1': {
        position: 'right',
        grid: {
          //color: 'rgba(255,0,0,0.3)',
        },
        ticks: {
          color: 'red'
        }
      }*/
    },

    plugins: {
      legend: { display: true },
    }
  };

  public lineChartType: ChartType = 'line';




  public chartClicked({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log(event, active);
  }

  /*
  //Circular
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
    labels: [ [ 'Download', 'Sales' ], [ 'In', 'Store', 'Sales' ], 'Mail Sales' ],
    datasets: [ {
      data: [ 300, 500, 100 ]
    } ]
  };
  public pieChartType: ChartType = 'pie';
  public pieChartPlugins = [ DatalabelsPlugin ];

  // events
  public chartClicked2({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered2({ event, active }: { event: ChartEvent, active: {}[] }): void {
    console.log(event, active);
  }

  changeLabels(): void {
    const words = [ 'hen', 'variable', 'embryo', 'instal', 'pleasant', 'physical', 'bomber', 'army', 'add', 'film',
      'conductor', 'comfortable', 'flourish', 'establish', 'circumstance', 'chimney', 'crack', 'hall', 'energy',
      'treat', 'window', 'shareholder', 'division', 'disk', 'temptation', 'chord', 'left', 'hospital', 'beef',
      'patrol', 'satisfied', 'academy', 'acceptance', 'ivory', 'aquarium', 'building', 'store', 'replace', 'language',
      'redeem', 'honest', 'intention', 'silk', 'opera', 'sleep', 'innocent', 'ignore', 'suite', 'applaud', 'funny' ];
    const randomWord = () => words[Math.trunc(Math.random() * words.length)];
    this.pieChartData.labels = new Array(3).map(_ => randomWord());

    this.chart?.update();
  }

  addSlice(): void {
    if (this.pieChartData.labels) {
      this.pieChartData.labels.push([ 'Line 1', 'Line 2', 'Line 3' ]);
    }

    this.pieChartData.datasets[0].data.push(400);

    this.chart?.update();
  }

  removeSlice(): void {
    if (this.pieChartData.labels) {
      this.pieChartData.labels.pop();
    }

    this.pieChartData.datasets[0].data.pop();

    this.chart?.update();
  }

  changeLegendPosition(): void {
    if (this.pieChartOptions?.plugins?.legend) {
      this.pieChartOptions.plugins.legend.position = this.pieChartOptions.plugins.legend.position === 'left' ? 'top' : 'left';
    }

    this.chart?.render();
  }

  toggleLegend(): void {
    if (this.pieChartOptions?.plugins?.legend) {
      this.pieChartOptions.plugins.legend.display = !this.pieChartOptions.plugins.legend.display;
    }

    this.chart?.render();
  }
  */
}
