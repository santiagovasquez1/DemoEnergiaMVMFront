import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Console } from 'console';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { GenerarEnergiaComponent } from 'src/app/shared/generar-energia/generar-energia.component';

@Component({
  selector: 'app-ver-generadores',
  templateUrl: './ver-generadores.component.html',
  styleUrls: ['./ver-generadores.component.css']
})
export class VerGeneradoresComponent implements OnInit {

  generadores: string[] = [];
  dirContratos: string[] = [];
  dirGeneradores: string[] = [];
  message: string;

  constructor(
    public dialog: MatDialog,
    private toastr: ToastrService,
    private generadorService: GeneradorFactoryService,
    private spinnerService: NgxSpinnerService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      await this.generadorService.loadBlockChainContractData();
      this.generadorService.verGeneradores().subscribe({
        next: data => {
          console.log(data);
          
          this.leerGeneradores(data);
        },
        error: err => {
          console.log(err);
          this.toastr.error('Error al cargar los generadores', 'Error');
        }
      });
    } catch (error) {
      console.log(error);
      this.toastr.error('Error al cargar el contrato', 'Error');
    }
  }

  leerGeneradores(data) {
    
    for(var gen of data){
      this.dirGeneradores.push(gen[0]);
      this.dirContratos.push(gen[1]);
      this.generadores.push(gen[2]);
      console.log(this.generadores);
    }

    if (this.generadores.length == 0) {
      this.message = "¡No hay generadores para mostrar!"
      console.log(this.message);
      this.toastr.error('¡No hay generadores para mostrar!', '');
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(GenerarEnergiaComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      console.log(res);
    })
  }

}
