import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import * as L from 'leaflet';
import {PopUpService} from "./pop-up.service";
import {Place, Visit} from "./model/place.model";

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  MARCH: string = '/assets/2020_MARCH.json';

  constructor(private http: HttpClient,
              private popUpService: PopUpService) { }

  makePointMarkers(map: L.map): void {
    this.http.get(this.MARCH).subscribe((res: any) => {
      let places = new Map<String, Place>();

      for (const c of res.timelineObjects) {
        if(c.placeVisit != null) {
          let placeId = c.placeVisit.location.placeId;
          if(places.has(placeId)){
            let place: Place = places.get(placeId);
            place.addVisit(Visit.fromPlaceVisit(c.placeVisit));
          } else {
            places.set(placeId, Place.fromPlaceVisit(c.placeVisit));
          }
        }
      }

      for (const p of places.values()) {
        const marker = L.marker([p.latitude, p.longitude]);
        let pointPopup = this.popUpService.makePointPopup(p);
        marker.bindPopup(pointPopup);
        marker.addTo(map);
      }
    });
  }
}
