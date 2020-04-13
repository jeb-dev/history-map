import { Injectable } from '@angular/core';
import {NgxIndexedDBService} from "ngx-indexed-db";
import {Place} from "./model/place.model";
import {Visit} from "./model/visit.model";

@Injectable({
  providedIn: 'root'
})
export class LoadMapService {

  constructor(private dbService: NgxIndexedDBService) { }

  public saveTakeoutPlaces(res: any) {

    this.dbService.getAll('places').then(
      (list: Place[]) => {
        for (const c of res.timelineObjects) {
          if (c.placeVisit != null) {
            let placeId = c.placeVisit.location.placeId;
            if (list.includes(placeId)) {
              this.saveVisit(Visit.fromPlaceVisit(c.placeVisit));
            } else {
              let place = Place.fromPlaceVisit(c.placeVisit);
              this.dbService.add('places', place);
              list.push(place);
              this.saveVisit(Visit.fromPlaceVisit(c.placeVisit));
            }
          }
        }
      }
    );
  }
  private saveVisit(v: Visit) {
    this.dbService.add('visits', v).then(
      () => {
      },
      error => {
        console.error("failed to add", error);
      }
    );
  }
}
