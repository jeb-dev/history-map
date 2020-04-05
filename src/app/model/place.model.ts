export class Visit {
  arrivedDate: Date;
  durationStay: number; //in seconds

  static fromPlaceVisit(placeVisit: any): Visit {
    let visit = new Visit();
    visit.arrivedDate = placeVisit.duration.startTimestampMs;
    visit.durationStay = (placeVisit.duration.endTimestampMs - placeVisit.duration.startTimestampMs)/1000;
    return visit;
  }

}


export class Place {
  private id: string;
  longitude: number;
  latitude: number;
  name: string;
  address: string;
  visits: Visit[] = [];

  addVisit(v: Visit) {
    this.visits.push(v);
  }

  static fromPlaceVisit(placeVisit: any): Place {
    let place = new Place();
    place.id = placeVisit.location.placeId  ;
    let E7 = 10000000.0;
    place.longitude = placeVisit.location.longitudeE7/E7;
    place.latitude = placeVisit.location.latitudeE7/E7;
    place.name = placeVisit.location.name;
    place.address = placeVisit.location.address;
    place.addVisit(Visit.fromPlaceVisit(placeVisit));
    return place;
  }
}
