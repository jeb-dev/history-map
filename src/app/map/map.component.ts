import {AfterViewInit, Component } from '@angular/core';

import * as L from 'leaflet';
import toGeoJson from "@mapbox/togeojson";
import { GeoUtils } from './geo-utils';
import {LoadDataService} from "../load-data.service";
import {LocationService} from "../services/location.service";
import {Trace} from "../model/trace.model";
import {Observable, of} from "rxjs";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map;
  private layerGroup;
  selectedMode: 'Slice' | 'Watch' | 'Build' = 'Watch';
  clickModes: string[] = ['Slice', 'Watch', 'Build'];

  constructor(private loadDataService: LoadDataService,
              private locationService: LocationService) { }

  ngAfterViewInit(): void {
    this.locationService.getPosition().then(pos=>
    {
      this.map.flyTo([pos.lat, pos.lng], 8);
    });
    this.initMap();
  }

  reloadMap() {
    var newGroup = L.layerGroup().addTo(this.map);
    this.loadDataService.getAllTraces().then(
      (list: Trace[]) => {
        for (const trace of list) {
            let geoJSON = L.geoJSON([trace], {
              style: {color: trace.color}
            });
            geoJSON.addTo(newGroup);
            geoJSON.on('click', (e) => {
              this.clickLine(e);
            });
        }
        this.layerGroup.clearLayers();
        this.layerGroup= newGroup;
      }
    );
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
    this.layerGroup = L.layerGroup().addTo(this.map);

    this.reloadMap();
  }

  private addLinesFromGPXstr(str: string) {
    var geojsonFeature = toGeoJson.gpx((new DOMParser()).parseFromString(str, 'text/xml'));
    let feature = geojsonFeature.features[0];
    feature.color = "#4488FF";
    this.loadDataService.saveTrace(feature);
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
      this.loadDataService.saveTrace(MapComponent.buildFromCoordinates(e.layer.feature.properties.name + "-1",
        coordinates.slice(0, closestIndex),
        "#ff4400"));
      this.loadDataService.saveTrace(MapComponent.buildFromCoordinates(e.layer.feature.properties.name + "-2",
        coordinates.slice(closestIndex, coordinates.length),
        "#eeFF00"));
      e.layer.remove();
      this.loadDataService.deleteTrace(e.layer.feature.id);
      this.reloadMap();
    } else if (this.selectedMode == "Build"){
      let newCrdnt = e.layer.feature.geometry.coordinates;
      this.loadDataService.getBuild().then(
        (trace: Trace) => {
          if(!trace) {
            let feature = MapComponent.buildFromCoordinates("Build", newCrdnt, "#1d8014");
            this.loadDataService.saveBuild(feature);
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
            this.loadDataService.updateTrace(trace);
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
    let uploadedFiles = element.target.files;
    let formData = new FormData();
    for (var i = 0; i < uploadedFiles.length; i++) {
      formData.append("uploads[]", uploadedFiles[i], uploadedFiles[i].name);
      let fileReader = new FileReader();
      fileReader.onload = (e) => {
        let toString = fileReader.result.toString();
        this.addLinesFromGPXstr(toString);
        if(i == uploadedFiles.length){
          this.reloadMap();
        }
      }
      fileReader.readAsText(uploadedFiles[i]);
    }
  }

  download() {
    this.loadDataService.getBuild().then((trace: Trace) => {
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


  resetBuild() {
    this.loadDataService.deleteBuild()
      .then(() => this.reloadMap());
  }

  reset() {
    this.loadDataService.deleteDatabase().then(
      () => this.reloadMap()
    );
  }
}
