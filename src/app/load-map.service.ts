import { Injectable } from '@angular/core';
import {NgxIndexedDBService} from "ngx-indexed-db";
import {Place, Visit} from "./model/place.model";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class LoadMapService {

  constructor(private dbService: NgxIndexedDBService) { }

  public saveTakeoutPlaces(res: any) {
    let places = new Map<String, Place>();

    this.dbService.getAll('places').then(
      (list: Place[]) => {
        for (const p of list) {
          places.set(p.id, p);
        }
        for (const c of res.timelineObjects) {
          if (c.placeVisit != null) {
            let placeId = c.placeVisit.location.placeId;
            if (places.has(placeId)) {
              let place: Place = places.get(placeId);
              place.visits.push(Visit.fromPlaceVisit(c.placeVisit));
            } else {
              places.set(placeId, Place.fromPlaceVisit(c.placeVisit));
            }
          }
        }
        this.saveInDB(places);
      }
    );
  }

  private saveInDB(places: Map<String, Place>) {
    this.dbService.clear('places');
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
