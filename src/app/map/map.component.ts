import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

import * as L from 'leaflet';
import toGeoJson from "@mapbox/togeojson";
import { GeoUtils } from './geo-utils';
import {LoadMapService} from "../load-map.service";
import {LocationService} from "../services/location.service";
import {NgxIndexedDBService} from "ngx-indexed-db";
import {Trace} from "../model/trace.model";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map;
  private uploadedFiles: Array <File>;
  selectedMode: 'Slice' | 'Watch' | 'Build' = 'Watch';
  clickModes: string[] = ['Slice', 'Watch', 'Build'];

  constructor(private loadMapService: LoadMapService,
              private locationService: LocationService,
              private dbService: NgxIndexedDBService) { }

  ngAfterViewInit(): void {
    this.locationService.getPosition().then(pos=>
    {
      this.map.flyTo([pos.lat, pos.lng], 8);
    });
    this.initMap();
  }

  reloadMap() {
    this.dbService.getAll('traces').then(
      (list: Trace[]) => {
        for (const trace of list) {
          this.addTraceOnMap(trace);
        }
      }
    );
  }

  private addTraceOnMap(trace: any) {
    let geoJSON = L.geoJSON([trace], {
      style: {color: trace.color}
    });
    geoJSON.addTo(this.map);
    geoJSON.on('click', (e) => {
      this.clickLine(e);
    });
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

    this.reloadMap();
  }

  private addLinesFromGPXstr(str: string) {
    var geojsonFeature = toGeoJson.gpx((new DOMParser()).parseFromString(str, 'text/xml'));
    let feature = geojsonFeature.features[0];
    feature.color = "#4488FF";
    this.loadMapService.saveTrace(feature);
  }

  private static buildFromCoordinates(name, coordinates, color: string) {
    return  {
      "type": "Feature",
      "properties": {
        "name": name,
      },
      "geometry": {
        "type": "LineString",
        "coordinates": coordinates,
      },
      "color": color,
    };
  }

  private clickLine(e) {
    if (this.selectedMode == 'Slice') {
      let coordinates = e.layer.feature.geometry.coordinates;
      let closestIndex = this.findClosestIndex(e.latlng, e.layer.feature.geometry.coordinates);
      this.loadMapService.saveTrace(MapComponent.buildFromCoordinates(e.layer.feature.properties.name + "-1",
        coordinates.slice(0, closestIndex),
        "#ff4400"));
      this.loadMapService.saveTrace(MapComponent.buildFromCoordinates(e.layer.feature.properties.name + "-2",
        coordinates.slice(closestIndex, coordinates.length),
        "#eeFF00"));
      e.layer.remove();
      this.dbService.delete("traces", e.layer.feature.id);
      this.reloadMap();
    } else if (this.selectedMode == "Build"){
      let newCrdnt = e.layer.feature.geometry.coordinates;
      this.loadMapService.getBuild().then(
        (trace: Trace) => {
          if(!trace) {
            let feature = MapComponent.buildFromCoordinates("Build", newCrdnt, "#1d8014");
            feature.build = true;
            this.loadMapService.saveTrace(
              feature)
          } else {
            let buildCoordiates = trace.geometry.coordinates;
            let lastPoint = buildCoordiates[buildCoordiates.length -1];
            let firstNew = newCrdnt[0];
            let lastNew = newCrdnt[newCrdnt.length -1];
            let dist1 = GeoUtils.distanceFromCrdnt(lastPoint, firstNew);
            let dist2 = GeoUtils.distanceFromCrdnt(lastPoint, lastNew);
            if(dist1 < dist2){
              buildCoordiates = buildCoordiates.concat(newCrdnt);
            } else {
              buildCoordiates = buildCoordiates.concat(newCrdnt.reverse());
            }
            trace.geometry.coordinates = buildCoordiates;
            this.dbService.update('traces', trace);
          }
          this.reloadMap();
        }
      );
      e.layer.remove();
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
      }
    }
    this.reloadMap();
  }

  download() {
    this.loadMapService.getBuild().then((trace: Trace) => {
      const xml = MapComponent.createXmlString(trace.geometry.coordinates);
      const url = 'data:text/json;charset=utf-8,' + xml;
      const link = document.createElement('a');
      link.download = `download.gpx`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
    });
  }

  private static createXmlString(lines: number[][][]): string {
    let result = '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1" version="1.1" creator="j.bellier"><metadata/>' +
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
    this.loadMapService.getBuild()
      .then((trace: Trace) => {
        this.dbService.delete('traces', trace.id);
        this.reloadMap();
      });
  }
}
