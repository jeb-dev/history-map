import { Injectable } from '@angular/core';
import {Place} from "./model/place.model";

@Injectable({
  providedIn: 'root'
})
export class PopUpService {

  constructor() { }

  makePointPopup(place: Place): string {
    return `` +
      `<div>Name : ${ place.name }</div>` +
      `<div>address : ${ place.address }</div>` +
      `<div>visite nbr : ${place.visits.length} </div>`;
  }

}
