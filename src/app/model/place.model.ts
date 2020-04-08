import {Visit} from "./visit.model";

export class Place {
  id: string;
  longitude: number;
  latitude: number;
  name: string;
  address: string;
  visits: Visit[] = [];

  static fromPlaceVisit(placeVisit: any): Place {
    let place = new Place();
    place.id = placeVisit.location.placeId  ;
    let E7 = 10000000.0;
    place.longitude = placeVisit.location.longitudeE7/E7;
    place.latitude = placeVisit.location.latitudeE7/E7;
    place.name = placeVisit.location.name;
    place.address = placeVisit.location.address;
    place.visits.push(Visit.fromPlaceVisit(placeVisit));
    return place;
  }
}
