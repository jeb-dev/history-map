import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  capitals: string = '/assets/test.geojson';

  constructor(private http: HttpClient) { }

  makePointMarkers(map: L.map): void {
    console.log("MakePoint");
    this.http.get(this.capitals).subscribe((res: any) => {
      console.log(res.features);
      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const marker = L.marker([lon, lat]).addTo(map);
      }
    });
  }
}
