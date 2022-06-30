import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GeneradorFactoryService } from 'src/app/services/generador-factory.service';
import { Web3Service } from '../../../services/web3.service';

@Component({
  selector: 'app-agregar-generador',
  templateUrl: './agregar-generador.component.html',
  styleUrls: ['./agregar-generador.component.css']
})
export class AgregarGeneradorComponent implements OnInit {

  generadorForm: FormGroup; 
  loading: boolean=false;
  
  constructor(private fb: FormBuilder,
              private web3Service: Web3Service,
              private toastr: ToastrService,
              private generadorService: GeneradorFactoryService
              ) { 
    
    this.generadorForm = this.fb.group({
      nombreGenerador: ['',Validators.required]
    });
  }

  async ngOnInit() {
    try{
      await this.generadorService.loadBlockChainContractData();
      console.log("Cargado generador!");
    }
    catch{
      console.log("Error generador!");
    }
  }


  guardarGenerador(): void{
    console.log("Guardando generador");
    this.generadorService.agregarGenerador(this.generadorForm.value.nombreGenerador).subscribe({

      next:data=>{
        debugger
        console.log(data);
        this.toastr.success('Generador guardado con éxito', 'Operación exitosa');
        this.generadorForm.reset();
        this.loading = false;
      },
      error: err => {
        debugger
        console.log(err);
        this.toastr.success('Error realizando la transacción', 'Error');
        this.generadorForm.reset();
        this.loading = false;
      }
    });

  }

}
