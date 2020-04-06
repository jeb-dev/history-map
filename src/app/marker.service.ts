import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import * as L from 'leaflet';
import {PopUpService} from "./pop-up.service";
import {Place, Visit} from "./model/place.model";
import {NgxIndexedDBService} from "ngx-indexed-db";

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  MARCH: string = '/assets/2020_MARCH.json';

  constructor(private http: HttpClient,
              private popUpService: PopUpService,
              private dbService: NgxIndexedDBService) { }

  makePointMarkers(map: L.map): void {
    this.dbService.getAll('places').then(
      (retrievedPlaces: Place[]) => {
        for (const p of retrievedPlaces) {
          const marker = L.marker([p.latitude, p.longitude]);
          let pointPopup = this.popUpService.makePointPopup(p);
          marker.bindPopup(pointPopup);
          marker.addTo(map);
        }
      },
      error => {
        console.error("error retrieving Places")
      }
    );
  }
}
