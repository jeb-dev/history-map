import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PopUpService {

  constructor() { }

  makePointPopup(data: any): string {
    return `` +
      `<div>Capital: ${ data.name }</div>`;
  }

}
