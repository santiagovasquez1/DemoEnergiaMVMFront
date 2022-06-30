import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Web3Service } from '../../../services/web3.service';

@Component({
  selector: 'app-agregar-generador',
  templateUrl: './agregar-generador.component.html',
  styleUrls: ['./agregar-generador.component.css']
})
export class AgregarGeneradorComponent implements OnInit {

  login: FormGroup; 
  loading: boolean=false;
  
  constructor(private fb: FormBuilder,
              private web3Service: Web3Service,
              private toastr: ToastrService
              ) { 
    
    this.login = this.fb.group({
      nombrePlanta: ['',Validators.required],
      cantidad: ['',Validators.required]
    });
  }

  ngOnInit(): void {
    this.conectar();
  }

  conectar(): void{
    //this.loading = true;
    this.web3Service.connectAccount().subscribe({
      next: data => {
        console.log(data);
        //this.guardarGenerador();
        
      },
      error: err => {
        console.log(err);
        this.loading = false;
      }
    });
  }

  guardarGenerador(): void{
    console.log("Guardando generador");

    this.web3Service.agregaraGenerador(this.login.value.nombrePlanta,this.login.value.cantidad).subscribe({
      next:data=> {
        console.log(data);
        this.toastr.success('Generador guardado con éxito', 'Operación exitosa');
        this.login.reset();
        this.loading = false;
      },
      error: err => {
        console.log(err);
        this.toastr.success('Error realizando la transacción', 'Error');
        this.login.reset();
        this.loading = false;
      }
    })
  }

}
