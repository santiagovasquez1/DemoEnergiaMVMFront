import { Component, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {default as Annotation} from '../../../../../node_modules/chartjs-plugin-annotation';
import { EthereumService } from 'src/app/services/dashboard/ethereum.service';

export interface PeriodicElement {
  nombre: string;
  tipo: string;
  cantidad: number;
  precio: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {nombre: 'EPM', cantidad: 100, tipo: 'Solar',precio:'2,300.00'},
  {nombre: 'ELECTROHUILA', cantidad: 400, tipo: 'Solar',precio:'2,600.00'},
  {nombre: 'EMCALI', cantidad: 694, tipo: 'Eólica',precio:'1,300.00'},
  {nombre: 'CELSIA', cantidad: 900, tipo: 'Solar',precio:'2,800.00'},
  {nombre: 'AES', cantidad: 1000, tipo: 'Eólica',precio:'2,400.00'}
];


@Component({
  selector: 'app-ethereum',
  templateUrl: './ethereum.component.html'
})
export class EthereumComponent implements OnInit {

  
  displayedColumns: string[] = ['nombre', 'cantidad', 'tipo','precio'];
  dataSource = ELEMENT_DATA;

  precio: string = '';
  constructor(private EthereumService: EthereumService ) { 
    Chart.register(Annotation)
  }

  ngOnInit(): void {
    
  }

  

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [ 650, 590, 1200, 1140, 1210, 1155, 1400,2065, 1900, 1800, 1750, 1896  ],
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
      /*
      annotation: {
        
        annotations: [
          {
            type: 'line',
            scaleID: 'x',
            value: 'March',
            //borderColor: 'orange',
            borderWidth: 2,
            label: {
              position: 'center',
              //enabled: true,
              //color: 'orange',
              content: 'LineAnno',
              font: {
                weight: 'bold'
              }
            }
          },
        ],
      }*/
    }
  };

  public lineChartType: ChartType = 'line';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private static generateNumber(i: number): number {
    return Math.floor((Math.random() * (i < 2 ? 100 : 1000)) + 1);
  }

  public randomize(): void {
    for (let i = 0; i < this.lineChartData.datasets.length; i++) {
      for (let j = 0; j < this.lineChartData.datasets[i].data.length; j++) {
        this.lineChartData.datasets[i].data[j] = EthereumComponent.generateNumber(i);
      }
    }
    this.chart?.update();
  }

  // events
  public chartClicked({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log(event, active);
  }

  public hideOne(): void {
    const isHidden = this.chart?.isDatasetHidden(1);
    this.chart?.hideDataset(1, !isHidden);
  }

  public pushOne(): void {
    this.lineChartData.datasets.forEach((x, i) => {
      const num = EthereumComponent.generateNumber(i);
      x.data.push(num);
    });
    this.lineChartData?.labels?.push(`Label ${ this.lineChartData.labels.length }`);

    this.chart?.update();
  }

  public changeColor(): void {
    this.lineChartData.datasets[2].borderColor = 'green';
    this.lineChartData.datasets[2].backgroundColor = `rgba(0, 255, 0, 0.3)`;

    this.chart?.update();
  }

  public changeLabel(): void {
    if (this.lineChartData.labels) {
      this.lineChartData.labels[2] = [ '1st Line', '2nd Line' ];
    }

    this.chart?.update();
  }





  /*

  getData(){
    this.EthereumService.precioEther().subscribe(data => {
      this.precio = data;
      console.log("customers:" ,this.precio);
    },err => {
      console.log(err.error);
    });
  }
  */

  



}
