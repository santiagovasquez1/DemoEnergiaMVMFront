import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
@Component({
  selector: 'app-generar-energia',
  templateUrl: './generar-energia.component.html',
  styleUrls: ['./generar-energia.component.css']
})
export class GenerarEnergiaComponent implements OnInit {

  generarEnergiaForm: FormGroup; 
  loading: boolean=false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<GenerarEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string
  ) {
    this.generarEnergiaForm = this.fb.group({
      nombreEnergia: ['',Validators.required],
      cantidadEnergia: ['',Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onClickNo():void{
    this.dialogRef.close()
  }

  generarEnergia() {
    
  }

}
