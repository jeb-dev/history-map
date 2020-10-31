import { getDistance } from "ol/sphere";

export class GeoUtils {
  public static distance(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      return dist * 1.609344;
    }
  }

  public static distanceFromCrdnt(point1, point2) {
    return getDistance(point1, point2)
  }

  public static elevation(point1, point2){
    let alt1 = point1[2];
    let alt2 = point2[2];
    return alt1<alt2 ? alt2 - alt1 : 0;
  }
}
