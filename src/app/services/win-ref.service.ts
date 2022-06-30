import { Injectable } from '@angular/core';

const w = () => {
  return window;
}

@Injectable({
  providedIn: 'root'
})
export class WinRefService {


  constructor() { }
  get window(): any {
    return w();
  }
  
}
