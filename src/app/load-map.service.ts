import { Injectable } from '@angular/core';
import {NgxIndexedDBService} from "ngx-indexed-db";
import {Place, Visit} from "./model/place.model";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class LoadMapService {

  MARCH: string = '/assets/2020_MARCH.json';

  constructor(private dbService: NgxIndexedDBService) { }

  public saveTakeoutPlaces(res: any) {
    let places = new Map<String, Place>();

    console.log(res.timelineObjects);
    for (const c of res.timelineObjects) {
      if (c.placeVisit != null) {
        let placeId = c.placeVisit.location.placeId;
        if (places.has(placeId)) {
          let place: Place = places.get(placeId);
          place.addVisit(Visit.fromPlaceVisit(c.placeVisit));
        } else {
          places.set(placeId, Place.fromPlaceVisit(c.placeVisit));
        }
      }
    }
    console.log(places.size);

    this.saveInDB(places);
  }

  private saveInDB(places: Map<String, Place>) {
    for (const p of places.values()) {
      this.dbService.add('places', p).then(
        () => {},
        error => {
          console.error("failed to add", error);
        }
      );
    }
  }
}
