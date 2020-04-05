import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import * as L from 'leaflet';
import {PopUpService} from "./pop-up.service";

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  capitals: string = '/assets/test.geojson';
  MARCH: string = '/assets/2020_MARCH.json';

  constructor(private http: HttpClient,
              private popUpService: PopUpService) { }

  makePointMarkers(map: L.map): void {
    this.http.get(this.capitals).subscribe((res: any) => {
      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const marker = L.marker([lon, lat]);
        let pointPopup = this.popUpService.makePointPopup(c);
        marker.bindPopup(pointPopup);
        marker.addTo(map)
      }
    });
  }
}
