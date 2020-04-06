import { AfterViewInit, Component } from '@angular/core';

import * as L from 'leaflet';
import { MarkerService } from "../marker.service";
import {LoadMapService} from "../load-map.service";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map;
  private uploadedFiles: Array <File>;

  constructor(private loadMapService: LoadMapService,
              private  markerService: MarkerService) { }

  ngAfterViewInit(): void {
    this.initMap();
    this.markerService.makePointMarkers(this.map);
  }

  reloadMap() {
    this.markerService.makePointMarkers(this.map);
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [ 45.7516, 5.1912 ],
      zoom: 6
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

  }

  fileChange(element) {
    this.uploadedFiles = element.target.files;
  }

  upload() {
    let formData = new FormData();
    for (var i = 0; i < this.uploadedFiles.length; i++) {
      formData.append("uploads[]", this.uploadedFiles[i], this.uploadedFiles[i].name);
      let fileReader = new FileReader();
      fileReader.onload = (e) => {
        this.loadMapService.saveTakeoutPlaces(JSON.parse(fileReader.result.toString()));
      };
      fileReader.readAsText(this.uploadedFiles[i]);
    }
  }
}
