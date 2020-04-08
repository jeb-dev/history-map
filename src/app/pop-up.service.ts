import { Injectable } from '@angular/core';
import {Place} from "./model/place.model";

@Injectable({
  providedIn: 'root'
})
export class PopUpService {

  constructor() { }

  makePointPopup(place: Place): string {
    let s = `` +
      `<div>Name : ${ place.name }</div>` +
      `<div>address : ${ place.address }</div>` +
      `<div>visite nbr : ${place.visits.length} </div>` +
      `<ul>`;
      for (const visit of place.visits) {
        s += `<li>${visit.arrivedDate.toLocaleString()}</li>`
      }
      s+= `</ul>`;
    return s;
  }

}
