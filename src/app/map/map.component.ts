import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

import * as L from 'leaflet';
import toGeoJson from "@mapbox/togeojson";
import { GeoUtils } from './geo-utils';
import { MarkerService } from "../marker.service";
import {LoadMapService} from "../load-map.service";
import {LocationService} from "../services/location.service";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map;
  private uploadedFiles: Array <File>;
  private buildCoordiates = [];
  selectedMode: 'Slice' | 'Watch' | 'Build' = 'Watch';
  clickModes: string[] = ['Slice', 'Watch', 'Build'];

  constructor(private loadMapService: LoadMapService,
              private locationService: LocationService,
              private  markerService: MarkerService) { }

  ngAfterViewInit(): void {
    this.locationService.getPosition().then(pos=>
    {
      this.map.flyTo([pos.lat, pos.lng], 8);
    });
    this.initMap();
    this.markerService.makePointMarkers(this.map);
  }

  reloadMap() {
    this.markerService.makePointMarkers(this.map);
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [ 45.7516, 5.1912 ],
      zoom: 3
    });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);

    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    //this.addLinesFromGPXstr(this.gpx);
  }

  private addLinesFromGPXstr(str: string) {
    var geojsonFeature = toGeoJson.gpx((new DOMParser()).parseFromString(str, 'text/xml'));
    let name = geojsonFeature.features[0].properties.name;
    let coordinates = geojsonFeature.features[0].geometry.coordinates;
    let color = "#4488FF";
    this.addLineFromCoordinates(name, coordinates, color);
  }

  private addLineFromCoordinates(name, coordinates, color: string) {
    var features = [{
      "type": "Feature",
      "properties": {
        "name": name,
      },
      "geometry": {
        "type": "LineString",
        "coordinates": coordinates,
      }
    }];
    let geoJSON = L.geoJSON(features, {
      style: {color: color}
    });
    geoJSON.addTo(this.map);
    geoJSON.on('click', (e) => {
      this.clickLine(e);
    });
  }

  private clickLine(e) {
    if (this.selectedMode == 'Slice') {
      let coordinates = e.layer.feature.geometry.coordinates;
      let closestIndex = this.findClosestIndex(e.latlng, e.layer.feature.geometry.coordinates);
      e.layer.remove();
      this.addLineFromCoordinates(e.layer.feature.properties.name + "-1",
        coordinates.slice(0, closestIndex),
        "#ff4400");
      this.addLineFromCoordinates(e.layer.feature.properties.name + "-2",
        coordinates.slice(closestIndex, coordinates.length),
        "#eeFF00");
    } else if (this.selectedMode == "Build"){
      let newCrdnt = e.layer.feature.geometry.coordinates;
      if(this.buildCoordiates.length == 0){
        this.buildCoordiates = newCrdnt;
      } else {
        let lastPoint = this.buildCoordiates[this.buildCoordiates.length -1];
        let firstNew = newCrdnt[0];
        let lastNew = newCrdnt[newCrdnt.length -1];
        let dist1 = GeoUtils.distanceFromCrdnt(lastPoint, firstNew);
        let dist2 = GeoUtils.distanceFromCrdnt(lastPoint, lastNew);
        if(dist1 < dist2){
          this.buildCoordiates = this.buildCoordiates.concat(newCrdnt);
        } else {
          this.buildCoordiates = this.buildCoordiates.concat(newCrdnt.reverse());
        }
      }
      this.addLineFromCoordinates("Build", this.buildCoordiates, "#E20")
    } else {
      let arr = e.layer.feature.geometry.coordinates;
      let distance = 0;
      let dPlus = 0;
      for (var i = 1; i < arr.length ; i++) {
        distance += GeoUtils.distanceFromCrdnt(arr[i-1], arr[i]);
        dPlus += GeoUtils.elevation(arr[i-1], arr[i]);
      }
      console.log(e.layer.feature.properties.name, "dist : " + distance, "D+ : " + dPlus);
    }
  }

  private findClosestIndex(goal, arr) {
    var indexArr = arr.map((k) => GeoUtils.distanceFromCrdnt(k, [goal.lng, goal.lat]))
    var min = Math.min.apply(Math, indexArr)
    return indexArr.indexOf(min);
  }

  fileChange(element) {
    this.uploadedFiles = element.target.files;
  }

  upload() {
    let formData = new FormData();
    for (var i = 0; i < this.uploadedFiles.length; i++) {
      formData.append("uploads[]", this.uploadedFiles[i], this.uploadedFiles[i].name);
      let fileReader = new FileReader();
      if(this.uploadedFiles[i].name.endsWith(".gpx")){
        fileReader.onload = (e) => {
          let toString = fileReader.result.toString();
          this.addLinesFromGPXstr(toString);
        }
        fileReader.readAsText(this.uploadedFiles[i]);
      } else if(this.uploadedFiles[i].name.endsWith(".json")) {
        fileReader.onload = (e) => {
          this.loadMapService.saveTakeoutPlaces(JSON.parse(fileReader.result.toString()));
        };
        fileReader.readAsText(this.uploadedFiles[i]);
      }
    }
  }

  download() {
    const xml = this.createXmlString(this.buildCoordiates);
    const url = 'data:text/json;charset=utf-8,' + xml;
    const link = document.createElement('a');
    link.download = `download.gpx`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
  }

  private createXmlString(lines: number[][][]): string {
    let result = '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="runtracker"><metadata/>' +
      '<trk><name></name><desc></desc>'
    result += lines.reduce((accum, point) => {
      let segmentTag = '<trkseg>';
      segmentTag += `<trkpt lat="${point[1]}" lon="${point[0]}"><ele>${point[2]}</ele></trkpt>`;
      segmentTag += '</trkseg>'

      return accum += segmentTag;
    }, '');
    result += '</trk></gpx>';
    return result;
  }


  reset() {
    this.buildCoordiates = [];
  }
}
