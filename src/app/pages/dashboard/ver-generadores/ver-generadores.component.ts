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

  generadores: string[] = ['Generador1', 'Generador2', 'Generador3', 'Generador4'];
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

  leerGeneradores() {
    if (this.generadores.length == 0) {
      this.message = "¡No hay generadores para mostrar!"
      console.log(this.message);
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(GenerarEnergiaComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      console.log(res);
    })
  }

}
