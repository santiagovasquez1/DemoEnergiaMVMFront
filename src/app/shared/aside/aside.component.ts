import { TiposContratos } from './../../models/EnumTiposContratos';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.css']
})
export class AsideComponent implements OnInit {
  tipoContrato: TiposContratos
  constructor() { 
    this.tipoContrato = parseInt(localStorage.getItem('tipoAgente')) as TiposContratos;
    
  }

  ngOnInit(): void {
  }

}
