// src/app/services/sweet-alert.service.ts
import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {
  constructor() {}

  /**
   * Muestra un confirm dialog. 
   * @param title      Título del modal
   * @param message    Mensaje principal (si no hay subtitleHtml)
   * @param subtitleHtml Bloque HTML opcional que se inserta debajo del mensaje
   */
  confirmAlert(
    title: string,
    message: string,
    subtitleHtml?: string
  ): Promise<SweetAlertResult> {
    const config: any = {
      title,
      icon: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      reverseButtons: true,
      customClass: {
        htmlContainer: 'alert-htmlContainer',
        confirmButton: 'alert-confirm-button',
        cancelButton: 'alert-cancel-button',
        icon: 'alert-icon'
      }
    };

    if (subtitleHtml) {
      // Si hay subtítulo HTML, usamos html
      config.html = `
        <p>${message}</p>
        <p style="font-size:0.9rem; margin-top:1rem;"><strong>Tokens disponibles:</strong> ${subtitleHtml}</p>
      `;
    } else {
      config.text = message;
    }

    return Swal.fire(config);
  }
}
