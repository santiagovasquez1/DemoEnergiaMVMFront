import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { GeneradorContractService } from 'src/app/services/generador-contract.service';
import { SweetAlertService } from 'src/app/services/sweet-alert.service';

export enum Estado {
  nuevaEnergia,
  inyectarEnergia
}

@Component({
  selector: 'app-nueva-energia',
  templateUrl: './nueva-energia.component.html'
})
export class NuevaEnergiaComponent implements OnInit {

  energiasDisponibles: string[] = [];
  nuevaEnergiaForm: UntypedFormGroup;
  estado: Estado;
  title: string

  constructor(public dialogRef: MatDialogRef<NuevaEnergiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generadorContract: GeneradorContractService,
    private alertDialog: SweetAlertService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private fb: UntypedFormBuilder) {
    this.energiasDisponibles = this.data.energiasDisponibles;
    this.estado = this.data.estado;
    switch (this.estado) {
      case Estado.nuevaEnergia:
        this.title = 'Crear nueva energía';
        break;
      case Estado.inyectarEnergia:
        this.title = 'Inyectar energía';
        break;
    }
    this.initForm();
  }

  async ngOnInit() {
    debugger;
    try {
      await this.generadorContract.loadBlockChainContractData(this.data.dirContract);
    } catch (error) {
      this.toastr.error(error.message, 'Error');
      this.dialogRef.close();
    }
  }

  initForm() {
    this.nuevaEnergiaForm = this.fb.group({
      nombreEnergia: ['', Validators.required],
      cantidadEnergia: ['', Validators.required]
    });
  }

  onCrearNuevaEnergia() {
    this.alertDialog.confirmAlert('Crear nueva energía', '¿Está seguro de crear la energía?').then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
        let nombreEnergia = this.nuevaEnergiaForm.get('nombreEnergia').value;
        let cantidadEnergia = this.nuevaEnergiaForm.get('cantidadEnergia').value;
        this.generadorContract.postCrearNuevaEnergia(nombreEnergia, cantidadEnergia).subscribe(
          {
            next: () => {
              this.spinner.hide();
              this.dialogRef.close();
              this.toastr.success('¡Energía agregada con éxito!');
            },
            error: (err) => {
              this.spinner.hide();
              console.log(err);
              this.toastr.error(err.message, 'Error');
              this.dialogRef.close();
            }
          }
        );
      }
    })
  }

  onInyectarEnergia() {
    this.alertDialog.confirmAlert('Inyectar energía', '¿Está seguro de inyectar la energía?').then(res => {
      if (res.isConfirmed) {
        this.spinner.show();
        let nombreEnergia = this.nuevaEnergiaForm.get('nombreEnergia').value;
        let cantidadEnergia = this.nuevaEnergiaForm.get('cantidadEnergia').value;
        const dirPlanta = this.data.hashPlanta;
        this.generadorContract.postInyectarEnergiaPlanta(dirPlanta,nombreEnergia, cantidadEnergia).subscribe({
          next: () => {
            this.spinner.hide();
            this.dialogRef.close();
            this.toastr.success('¡Energía agregada con éxito!');
          },error: (err) => {
            this.spinner.hide();
            console.log(err);
            this.toastr.error(err.message, 'Error');
            this.dialogRef.close();
          }
        });       
      }
    });
  }
}
