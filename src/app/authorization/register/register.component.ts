import { MunicipioInfo } from './../../models/municipioInfo';
import { MunicipiosService } from './../../services/municipios.service';
import { SolicitudContrato } from './../../models/solicitudContrato';
import { ToastrService } from 'ngx-toastr';
import { ReguladorMercadoService } from 'src/app/services/regulador-mercado.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  agentesMercado: any = [{
    tipo: 'Agente Cliente',
    id: 0
  }, {
    tipo: 'Agente Comercializador',
    id: 1
  }, {
    tipo: 'Agente Generador',
    id: 2
  }]

  tiposCoComercializador: any[] = [
    {
      id: 0,
      tipo: 'Cliente'
    },
    {
      id: 1,
      tipo: 'Generador'
    }
  ]

  agenteMercado: number = 0;
  departamentos: string[] = [];
  municipiosDepartamento: string[] = [];
  municipiosInfo: MunicipioInfo[] = [];
  registroForm: FormGroup;
  constructor(private fb: FormBuilder,
    private reguladorMercado: ReguladorMercadoService,
    private toastr: ToastrService,
    private router: Router,
    private municipioService: MunicipiosService) {
    this.registroForm = this.fb.group({});
  }

  async ngOnInit(): Promise<void> {
    this.initRegistroForm();
    await this.reguladorMercado.loadBlockChainContractData();
    this.municipioService.getMunicipios().subscribe({
      next: (res) => {
        this.municipiosInfo = res;
        this.departamentos = res.map(item => item.departamento).filter((value, index, self) => self.indexOf(value) === index);
      }, error: (err) => {
        console.log(err);
        this.toastr.error('Error al cargar los municipios', 'Error');
      }
    });
  }

  initRegistroForm() {
    this.registroForm = this.fb.group(
      {
        nit: ['', Validators.required],
        empresa: ['', Validators.required],
        contacto: ['', Validators.required],
        telefono: ['', Validators.required],
        correo: ['', [Validators.required, Validators.email]],
        departamento: ['', Validators.required],
        ciudad: [{ value: '', disabled: true }, Validators.required],
        direccion: ['', Validators.required],
      }
    );

    this.registroForm.get('departamento').valueChanges.subscribe(
      (departamento) => {
        this.registroForm.get('ciudad').setValue('');
        this.municipiosDepartamento = this.municipiosInfo.filter(item => item.departamento == departamento).map(item => item.municipio);
        this.registroForm.get('ciudad').enable();
      }
    );
  }

  onTipoComercializadorChange() {
    if (this.agenteMercado == 1) {
      this.registroForm.addControl('tipoComercio', this.fb.control('', Validators.required));
    } else {
      this.registroForm.removeControl('tipoComercio');
    }
  }

  onSubmit() {
    let solicitudContrato: SolicitudContrato = {
      tipoContrato: this.agenteMercado as TiposContratos,
      infoContrato: {
        nit: this.registroForm.value.nit,
        empresa: this.registroForm.value.empresa,
        contacto: this.registroForm.value.contacto,
        telefono: this.registroForm.value.telefono,
        correo: this.registroForm.value.correo,
        departamento: this.registroForm.value.departamento,
        ciudad: this.registroForm.value.ciudad,
        direccion: this.registroForm.value.direccion,
        tipoComercio: this.registroForm.value.tipoComercio ? this.registroForm.value.tipoComercio : 0,
        owner: localStorage.getItem('account'),
        comercializador: '0x0000000000000000000000000000000000000000',
        dirContrato: '0x0000000000000000000000000000000000000000'
      }
    }

    this.reguladorMercado.postRegistrarSolicitud(solicitudContrato.infoContrato, solicitudContrato.tipoContrato).subscribe({
      next: (res) => {
        //TODO: Notificar al administrador que se ha registrado una solicitud
        this.toastr.success('Solicitud enviada correctamente');
        this.router.navigate(['/login']);
      }, error: (err) => {
        console.log(err);
        this.toastr.error('Error al enviar la solicitud');
        this.router.navigate(['/register']);
      }
    })
  }
}
