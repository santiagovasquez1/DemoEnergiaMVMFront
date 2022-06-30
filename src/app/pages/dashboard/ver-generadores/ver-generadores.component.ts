import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Console } from 'console';
import { GenerarEnergiaComponent } from 'src/app/shared/generar-energia/generar-energia.component';

@Component({
  selector: 'app-ver-generadores',
  templateUrl: './ver-generadores.component.html',
  styleUrls: ['./ver-generadores.component.css']
})
export class VerGeneradoresComponent implements OnInit {

  generadores: string[] = ['Generador1','Generador2','Generador3','Generador4'];
  message: string;

  constructor(
    public dialog: MatDialog 
  ) { }

  ngOnInit(): void {
    this.leerGeneradores();
  }

  leerGeneradores() {
    if(this.generadores.length == 0){
      this.message = "¡No hay generadores para mostrar!"
      console.log(this.message);
    }
  }

  openDialog(): void{
    const dialogRef = this.dialog.open(GenerarEnergiaComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      console.log(res);
    })
  }

}
