export class Visit {
  placeId: string;
  arrivedDate: Date;
  durationStay: number; //in seconds

  static fromPlaceVisit(placeVisit: any): Visit {
    let visit = new Visit();
    visit.placeId = placeVisit.location.placeId;
    visit.arrivedDate = placeVisit.duration.startTimestampMs;
    visit.durationStay = (placeVisit.duration.endTimestampMs - placeVisit.duration.startTimestampMs)/1000;
    return visit;
  }

}
