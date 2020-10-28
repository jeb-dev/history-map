import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

import * as L from 'leaflet';
import toGeoJson from 'togeojson';
import { MarkerService } from "../marker.service";
import {LoadMapService} from "../load-map.service";
import {LocationService} from "../services/location.service";
import {collectExternalReferences} from "@angular/compiler";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map;
  private uploadedFiles: Array <File>;
  selectedMode: 'Slice' | 'Watch' = 'Watch';
  clickModes: string[] = ['Slice', 'Watch'];

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
    let coordinates = geojsonFeature.features[0].geometry.coordinates;

    var features = [{
      "type": "Feature",
      "properties": {"party": "ONE"},
      "geometry": {
        "type": "LineString",
        "coordinates": coordinates
      }
    }];
    let geoJSON = L.geoJSON(features, {
      style: function (feature) {
        switch (feature.properties.party) {
          case 'ONE':
            return {color: "#4488FF"};
        }
      }
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
      this.addLines(coordinates.slice(0, closestIndex), coordinates.slice(closestIndex, coordinates.length));
    } else {
      console.log('Watch!!');
    }
  }

  private addLines(firstSlice, secondSlice) {
    var features = [{
      "type": "Feature",
      "properties": {"party": "ONE"},
      "geometry": {
        "type": "LineString",
        "coordinates": firstSlice,
      }
    }, {
      "type": "Feature",
      "properties": {"party": "TWO"},
      "geometry": {
        "type": "LineString",
        "coordinates": secondSlice,
      }
    }];
    L.geoJSON(features, {
      style: function (feature) {
        switch (feature.properties.party) {
          case 'ONE':
            return {color: "#ff4400"};
          case 'TWO':
            return {color: "#eeFF00"};
        }
      }
    }).on('click', (e) => {
      this.clickLine(e);
    }).addTo(this.map);
  }

  private findClosestIndex(goal, arr) {
    var indexArr = arr.map((k) => Math.abs(k[1] - goal.lat))
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
          debugger
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

  private gpx: string = "<?xml version='1.0' encoding='UTF-8'?>\n" +
    "<gpx version=\"1.1\" creator=\"https://www.komoot.de\" xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\">\n" +
    "  <metadata>\n" +
    "    <name>CC05 2020 Paris-Moret sur Loing</name>\n" +
    "    <author>\n" +
    "      <link href=\"https://www.komoot.de\">\n" +
    "        <text>komoot</text>\n" +
    "        <type>text/html</type>\n" +
    "      </link>\n" +
    "    </author>\n" +
    "  </metadata>\n" +
    "  <trk>\n" +
    "    <name>CC05 2020 Paris-Moret sur Loing</name>\n" +
    "    <trkseg>\n" +
    "      <trkpt lat=\"48.824809\" lon=\"2.411737\">\n" +
    "        <ele>52.091362</ele>\n" +
    "        <time>2020-10-13T20:30:02.377Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824809\" lon=\"2.411737\">\n" +
    "        <ele>52.091362</ele>\n" +
    "        <time>2020-10-13T20:30:02.478Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824747\" lon=\"2.412300\">\n" +
    "        <ele>52.091362</ele>\n" +
    "        <time>2020-10-13T20:30:07.827Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824740\" lon=\"2.412421\">\n" +
    "        <ele>52.091362</ele>\n" +
    "        <time>2020-10-13T20:30:08.990Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824731\" lon=\"2.412589\">\n" +
    "        <ele>52.091362</ele>\n" +
    "        <time>2020-10-13T20:30:10.482Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824730\" lon=\"2.412628\">\n" +
    "        <ele>52.091362</ele>\n" +
    "        <time>2020-10-13T20:30:10.853Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824726\" lon=\"2.412791\">\n" +
    "        <ele>52.091362</ele>\n" +
    "        <time>2020-10-13T20:30:12.438Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824722\" lon=\"2.413881\">\n" +
    "        <ele>52.333823</ele>\n" +
    "        <time>2020-10-13T20:30:23.535Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824776\" lon=\"2.414959\">\n" +
    "        <ele>52.666893</ele>\n" +
    "        <time>2020-10-13T20:30:34.953Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824782\" lon=\"2.415072\">\n" +
    "        <ele>52.701819</ele>\n" +
    "        <time>2020-10-13T20:30:36.377Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824784\" lon=\"2.415237\">\n" +
    "        <ele>52.752660</ele>\n" +
    "        <time>2020-10-13T20:30:38.208Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824784\" lon=\"2.415352\">\n" +
    "        <ele>52.788089</ele>\n" +
    "        <time>2020-10-13T20:30:39.547Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824721\" lon=\"2.416600\">\n" +
    "        <ele>53.615813</ele>\n" +
    "        <time>2020-10-13T20:30:55.448Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824721\" lon=\"2.416606\">\n" +
    "        <ele>53.621057</ele>\n" +
    "        <time>2020-10-13T20:30:55.613Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824544\" lon=\"2.417663\">\n" +
    "        <ele>54.574316</ele>\n" +
    "        <time>2020-10-13T20:31:11.092Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824513\" lon=\"2.417829\">\n" +
    "        <ele>54.725129</ele>\n" +
    "        <time>2020-10-13T20:31:13.440Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824452\" lon=\"2.418059\">\n" +
    "        <ele>54.941853</ele>\n" +
    "        <time>2020-10-13T20:31:16.710Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824300\" lon=\"2.418637\">\n" +
    "        <ele>55.408243</ele>\n" +
    "        <time>2020-10-13T20:31:24.702Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.820658\" lon=\"2.467305\">\n" +
    "        <ele>43.773279</ele>\n" +
    "        <time>2020-10-13T20:40:59.066Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.820771\" lon=\"2.467295\">\n" +
    "        <ele>43.381152</ele>\n" +
    "        <time>2020-10-13T20:41:00.202Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.820885\" lon=\"2.467286\">\n" +
    "        <ele>42.985691</ele>\n" +
    "        <time>2020-10-13T20:41:01.398Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.820907\" lon=\"2.467278\">\n" +
    "        <ele>42.907323</ele>\n" +
    "        <time>2020-10-13T20:41:01.631Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.821761\" lon=\"2.466976\">\n" +
    "        <ele>41.309569</ele>\n" +
    "        <time>2020-10-13T20:41:11.228Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.821943\" lon=\"2.466924\">\n" +
    "        <ele>41.033513</ele>\n" +
    "        <time>2020-10-13T20:41:13.487Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.822915\" lon=\"2.466629\">\n" +
    "        <ele>39.598552</ele>\n" +
    "        <time>2020-10-13T20:41:25.933Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.823131\" lon=\"2.466584\">\n" +
    "        <ele>39.360079</ele>\n" +
    "        <time>2020-10-13T20:41:28.498Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.823601\" lon=\"2.466628\">\n" +
    "        <ele>38.845018</ele>\n" +
    "        <time>2020-10-13T20:41:34.208Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824021\" lon=\"2.466794\">\n" +
    "        <ele>38.370323</ele>\n" +
    "        <time>2020-10-13T20:41:39.415Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824204\" lon=\"2.466866\">\n" +
    "        <ele>38.163551</ele>\n" +
    "        <time>2020-10-13T20:41:41.536Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824483\" lon=\"2.467025\">\n" +
    "        <ele>37.837608</ele>\n" +
    "        <time>2020-10-13T20:41:45.208Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824496\" lon=\"2.467032\">\n" +
    "        <ele>37.822522</ele>\n" +
    "        <time>2020-10-13T20:41:45.331Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.824573\" lon=\"2.467069\">\n" +
    "        <ele>37.741909</ele>\n" +
    "        <time>2020-10-13T20:41:46.317Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.825210\" lon=\"2.467375\">\n" +
    "        <ele>37.403218</ele>\n" +
    "        <time>2020-10-13T20:41:54.533Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.825426\" lon=\"2.467400\">\n" +
    "        <ele>37.293400</ele>\n" +
    "        <time>2020-10-13T20:41:57.607Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.825560\" lon=\"2.467424\">\n" +
    "        <ele>37.224998</ele>\n" +
    "        <time>2020-10-13T20:41:59.173Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.825644\" lon=\"2.467434\">\n" +
    "        <ele>37.182284</ele>\n" +
    "        <time>2020-10-13T20:42:00.419Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.825964\" lon=\"2.467473\">\n" +
    "        <ele>37.019539</ele>\n" +
    "        <time>2020-10-13T20:42:04.828Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.826109\" lon=\"2.467490\">\n" +
    "        <ele>36.945813</ele>\n" +
    "        <time>2020-10-13T20:42:07.221Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.827264\" lon=\"2.468307\">\n" +
    "        <ele>36.990785</ele>\n" +
    "        <time>2020-10-13T20:42:27.415Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.827483\" lon=\"2.468525\">\n" +
    "        <ele>37.028867</ele>\n" +
    "        <time>2020-10-13T20:42:31.649Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.828447\" lon=\"2.469750\">\n" +
    "        <ele>36.985726</ele>\n" +
    "        <time>2020-10-13T20:42:49.863Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.828695\" lon=\"2.470076\">\n" +
    "        <ele>36.938305</ele>\n" +
    "        <time>2020-10-13T20:42:54.457Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.829291\" lon=\"2.470865\">\n" +
    "        <ele>36.836518</ele>\n" +
    "        <time>2020-10-13T20:43:05.711Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.829332\" lon=\"2.470930\">\n" +
    "        <ele>36.835451</ele>\n" +
    "        <time>2020-10-13T20:43:06.866Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.829673\" lon=\"2.471372\">\n" +
    "        <ele>36.827381</ele>\n" +
    "        <time>2020-10-13T20:43:15.682Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.829911\" lon=\"2.471755\">\n" +
    "        <ele>36.821139</ele>\n" +
    "        <time>2020-10-13T20:43:22.556Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.829945\" lon=\"2.471848\">\n" +
    "        <ele>36.819879</ele>\n" +
    "        <time>2020-10-13T20:43:24.038Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.830120\" lon=\"2.472327\">\n" +
    "        <ele>36.813386</ele>\n" +
    "        <time>2020-10-13T20:43:31.307Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.830278\" lon=\"2.472829\">\n" +
    "        <ele>36.806792</ele>\n" +
    "        <time>2020-10-13T20:43:38.941Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.830318\" lon=\"2.472948\">\n" +
    "        <ele>36.814463</ele>\n" +
    "        <time>2020-10-13T20:43:40.665Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.830780\" lon=\"2.474218\">\n" +
    "        <ele>37.021493</ele>\n" +
    "        <time>2020-10-13T20:44:01.181Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.830817\" lon=\"2.474298\">\n" +
    "        <ele>37.035443</ele>\n" +
    "        <time>2020-10-13T20:44:02.507Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832533\" lon=\"2.496183\">\n" +
    "        <ele>39.171801</ele>\n" +
    "        <time>2020-10-13T20:50:51.298Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832520\" lon=\"2.496135\">\n" +
    "        <ele>39.151588</ele>\n" +
    "        <time>2020-10-13T20:50:51.933Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832514\" lon=\"2.496100\">\n" +
    "        <ele>39.137503</ele>\n" +
    "        <time>2020-10-13T20:50:52.405Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832473\" lon=\"2.495690\">\n" +
    "        <ele>38.976004</ele>\n" +
    "        <time>2020-10-13T20:50:57.844Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832451\" lon=\"2.495733\">\n" +
    "        <ele>38.954795</ele>\n" +
    "        <time>2020-10-13T20:50:58.333Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832434\" lon=\"2.495951\">\n" +
    "        <ele>38.869305</ele>\n" +
    "        <time>2020-10-13T20:51:00.611Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832430\" lon=\"2.496100\">\n" +
    "        <ele>38.811231</ele>\n" +
    "        <time>2020-10-13T20:51:01.876Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832422\" lon=\"2.496142\">\n" +
    "        <ele>38.794204</ele>\n" +
    "        <time>2020-10-13T20:51:02.297Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832396\" lon=\"2.496413\">\n" +
    "        <ele>38.687552</ele>\n" +
    "        <time>2020-10-13T20:51:04.858Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832389\" lon=\"2.496453\">\n" +
    "        <ele>38.677945</ele>\n" +
    "        <time>2020-10-13T20:51:05.421Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832388\" lon=\"2.496501\">\n" +
    "        <ele>38.671109</ele>\n" +
    "        <time>2020-10-13T20:51:06.179Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832442\" lon=\"2.496698\">\n" +
    "        <ele>38.640729</ele>\n" +
    "        <time>2020-10-13T20:51:07.990Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832457\" lon=\"2.496717\">\n" +
    "        <ele>38.636505</ele>\n" +
    "        <time>2020-10-13T20:51:08.295Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832457\" lon=\"2.496717\">\n" +
    "        <ele>38.636505</ele>\n" +
    "        <time>2020-10-13T20:51:08.348Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832450\" lon=\"2.496747\">\n" +
    "        <ele>38.631974</ele>\n" +
    "        <time>2020-10-13T20:51:08.634Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832451\" lon=\"2.496766\">\n" +
    "        <ele>38.629260</ele>\n" +
    "        <time>2020-10-13T20:51:08.818Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832457\" lon=\"2.496896\">\n" +
    "        <ele>38.610707</ele>\n" +
    "        <time>2020-10-13T20:51:10.083Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832467\" lon=\"2.496975\">\n" +
    "        <ele>38.599255</ele>\n" +
    "        <time>2020-10-13T20:51:11.011Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832468\" lon=\"2.497035\">\n" +
    "        <ele>38.590710</ele>\n" +
    "        <time>2020-10-13T20:51:11.931Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832466\" lon=\"2.497114\">\n" +
    "        <ele>38.579455</ele>\n" +
    "        <time>2020-10-13T20:51:12.670Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832463\" lon=\"2.497334\">\n" +
    "        <ele>38.548128</ele>\n" +
    "        <time>2020-10-13T20:51:14.616Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832423\" lon=\"2.497907\">\n" +
    "        <ele>38.466097</ele>\n" +
    "        <time>2020-10-13T20:51:20.666Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832398\" lon=\"2.498161\">\n" +
    "        <ele>38.429535</ele>\n" +
    "        <time>2020-10-13T20:51:23.270Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832365\" lon=\"2.498468\">\n" +
    "        <ele>38.385250</ele>\n" +
    "        <time>2020-10-13T20:51:26.115Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.832000\" lon=\"2.500133\">\n" +
    "        <ele>37.805789</ele>\n" +
    "        <time>2020-10-13T20:51:40.468Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.831979\" lon=\"2.500221\">\n" +
    "        <ele>37.764537</ele>\n" +
    "        <time>2020-10-13T20:51:41.138Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.831694\" lon=\"2.501391\">\n" +
    "        <ele>37.214725</ele>\n" +
    "        <time>2020-10-13T20:51:51.771Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.831614\" lon=\"2.501778\">\n" +
    "        <ele>37.098801</ele>\n" +
    "        <time>2020-10-13T20:51:55.421Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.831540\" lon=\"2.502217\">\n" +
    "        <ele>37.137961</ele>\n" +
    "        <time>2020-10-13T20:51:59.974Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.831468\" lon=\"2.502762\">\n" +
    "        <ele>37.185995</ele>\n" +
    "        <time>2020-10-13T20:52:05.542Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.831325\" lon=\"2.503370\">\n" +
    "        <ele>37.241787</ele>\n" +
    "        <time>2020-10-13T20:52:12.172Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.831312\" lon=\"2.503461\">\n" +
    "        <ele>37.249834</ele>\n" +
    "        <time>2020-10-13T20:52:13.202Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.850546\" lon=\"2.515223\">\n" +
    "        <ele>38.076749</ele>\n" +
    "        <time>2020-10-13T21:05:19.325Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.850896\" lon=\"2.515901\">\n" +
    "        <ele>38.169960</ele>\n" +
    "        <time>2020-10-13T21:05:28.850Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.850889\" lon=\"2.515963\">\n" +
    "        <ele>38.176764</ele>\n" +
    "        <time>2020-10-13T21:05:29.640Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851158\" lon=\"2.517039\">\n" +
    "        <ele>38.301266</ele>\n" +
    "        <time>2020-10-13T21:05:45.626Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851277\" lon=\"2.517516\">\n" +
    "        <ele>38.353265</ele>\n" +
    "        <time>2020-10-13T21:05:52.588Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851314\" lon=\"2.517679\">\n" +
    "        <ele>38.345809</ele>\n" +
    "        <time>2020-10-13T21:05:54.661Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851374\" lon=\"2.518009\">\n" +
    "        <ele>38.331005</ele>\n" +
    "        <time>2020-10-13T21:05:59.300Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851617\" lon=\"2.519745\">\n" +
    "        <ele>38.254258</ele>\n" +
    "        <time>2020-10-13T21:06:21.885Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851837\" lon=\"2.521880\">\n" +
    "        <ele>38.443813</ele>\n" +
    "        <time>2020-10-13T21:06:52.362Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851860\" lon=\"2.522052\">\n" +
    "        <ele>38.464800</ele>\n" +
    "        <time>2020-10-13T21:06:54.809Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851905\" lon=\"2.522399\">\n" +
    "        <ele>38.507089</ele>\n" +
    "        <time>2020-10-13T21:06:59.649Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851907\" lon=\"2.522414\">\n" +
    "        <ele>38.508919</ele>\n" +
    "        <time>2020-10-13T21:06:59.874Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851921\" lon=\"2.522547\">\n" +
    "        <ele>38.525024</ele>\n" +
    "        <time>2020-10-13T21:07:01.727Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851942\" lon=\"2.522748\">\n" +
    "        <ele>38.549359</ele>\n" +
    "        <time>2020-10-13T21:07:04.515Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.851960\" lon=\"2.522918\">\n" +
    "        <ele>38.571463</ele>\n" +
    "        <time>2020-10-13T21:07:06.855Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852023\" lon=\"2.522879\">\n" +
    "        <ele>38.586452</ele>\n" +
    "        <time>2020-10-13T21:07:07.877Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852052\" lon=\"2.523225\">\n" +
    "        <ele>38.637022</ele>\n" +
    "        <time>2020-10-13T21:07:11.390Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852110\" lon=\"2.523935\">\n" +
    "        <ele>38.740751</ele>\n" +
    "        <time>2020-10-13T21:07:18.411Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852224\" lon=\"2.525407\">\n" +
    "        <ele>38.955640</ele>\n" +
    "        <time>2020-10-13T21:07:34.149Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852254\" lon=\"2.526011\">\n" +
    "        <ele>39.137010</ele>\n" +
    "        <time>2020-10-13T21:07:40.651Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852288\" lon=\"2.526739\">\n" +
    "        <ele>39.360205</ele>\n" +
    "        <time>2020-10-13T21:07:51.602Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852551\" lon=\"2.529124\">\n" +
    "        <ele>39.672446</ele>\n" +
    "        <time>2020-10-13T21:08:26.689Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853118\" lon=\"2.531975\">\n" +
    "        <ele>39.080744</ele>\n" +
    "        <time>2020-10-13T21:09:02.967Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853215\" lon=\"2.532647\">\n" +
    "        <ele>38.871287</ele>\n" +
    "        <time>2020-10-13T21:09:11.307Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853228\" lon=\"2.532687\">\n" +
    "        <ele>38.857705</ele>\n" +
    "        <time>2020-10-13T21:09:11.738Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853246\" lon=\"2.532730\">\n" +
    "        <ele>38.842189</ele>\n" +
    "        <time>2020-10-13T21:09:12.420Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853333\" lon=\"2.534840\">\n" +
    "        <ele>38.594370</ele>\n" +
    "        <time>2020-10-13T21:09:39.462Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853326\" lon=\"2.535532\">\n" +
    "        <ele>38.578606</ele>\n" +
    "        <time>2020-10-13T21:09:49.017Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853247\" lon=\"2.536011\">\n" +
    "        <ele>38.567358</ele>\n" +
    "        <time>2020-10-13T21:09:55.935Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853192\" lon=\"2.536297\">\n" +
    "        <ele>38.591768</ele>\n" +
    "        <time>2020-10-13T21:10:00.257Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853112\" lon=\"2.536569\">\n" +
    "        <ele>38.644712</ele>\n" +
    "        <time>2020-10-13T21:10:04.284Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852853\" lon=\"2.537569\">\n" +
    "        <ele>38.835688</ele>\n" +
    "        <time>2020-10-13T21:10:19.376Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852782\" lon=\"2.538067\">\n" +
    "        <ele>38.926239</ele>\n" +
    "        <time>2020-10-13T21:10:26.563Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852670\" lon=\"2.538953\">\n" +
    "        <ele>39.084494</ele>\n" +
    "        <time>2020-10-13T21:10:39.212Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852560\" lon=\"2.540480\">\n" +
    "        <ele>39.342061</ele>\n" +
    "        <time>2020-10-13T21:11:01.093Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852549\" lon=\"2.540686\">\n" +
    "        <ele>39.376715</ele>\n" +
    "        <time>2020-10-13T21:11:03.989Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852555\" lon=\"2.540818\">\n" +
    "        <ele>39.398901</ele>\n" +
    "        <time>2020-10-13T21:11:05.869Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852551\" lon=\"2.541107\">\n" +
    "        <ele>39.447369</ele>\n" +
    "        <time>2020-10-13T21:11:09.823Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852560\" lon=\"2.541300\">\n" +
    "        <ele>39.479811</ele>\n" +
    "        <time>2020-10-13T21:11:12.440Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852568\" lon=\"2.541416\">\n" +
    "        <ele>39.499368</ele>\n" +
    "        <time>2020-10-13T21:11:14.128Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852622\" lon=\"2.542034\">\n" +
    "        <ele>39.439889</ele>\n" +
    "        <time>2020-10-13T21:11:22.448Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852712\" lon=\"2.542323\">\n" +
    "        <ele>39.401610</ele>\n" +
    "        <time>2020-10-13T21:11:26.581Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852723\" lon=\"2.542362\">\n" +
    "        <ele>39.396530</ele>\n" +
    "        <time>2020-10-13T21:11:27.239Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852756\" lon=\"2.542484\">\n" +
    "        <ele>39.380738</ele>\n" +
    "        <time>2020-10-13T21:11:28.991Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852838\" lon=\"2.542777\">\n" +
    "        <ele>39.342618</ele>\n" +
    "        <time>2020-10-13T21:11:33.071Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.852942\" lon=\"2.543045\">\n" +
    "        <ele>39.305368</ele>\n" +
    "        <time>2020-10-13T21:11:37.043Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.853691\" lon=\"2.544286\">\n" +
    "        <ele>38.990832</ele>\n" +
    "        <time>2020-10-13T21:11:57.979Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.785953\" lon=\"2.770852\">\n" +
    "        <ele>119.799738</ele>\n" +
    "        <time>2020-10-13T22:44:42.718Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.785270\" lon=\"2.771165\">\n" +
    "        <ele>119.483686</ele>\n" +
    "        <time>2020-10-13T22:44:52.306Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.784909\" lon=\"2.771391\">\n" +
    "        <ele>119.310697</ele>\n" +
    "        <time>2020-10-13T22:44:57.420Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.784810\" lon=\"2.771552\">\n" +
    "        <ele>119.246419</ele>\n" +
    "        <time>2020-10-13T22:44:59.375Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.784724\" lon=\"2.771705\">\n" +
    "        <ele>119.187719</ele>\n" +
    "        <time>2020-10-13T22:45:01.027Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.784656\" lon=\"2.771836\">\n" +
    "        <ele>119.139043</ele>\n" +
    "        <time>2020-10-13T22:45:02.405Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.784453\" lon=\"2.772202\">\n" +
    "        <ele>118.869263</ele>\n" +
    "        <time>2020-10-13T22:45:06.385Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.784280\" lon=\"2.772745\">\n" +
    "        <ele>118.518861</ele>\n" +
    "        <time>2020-10-13T22:45:11.340Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.783868\" lon=\"2.773484\">\n" +
    "        <ele>117.956470</ele>\n" +
    "        <time>2020-10-13T22:45:19.193Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.781775\" lon=\"2.775163\">\n" +
    "        <ele>115.710318</ele>\n" +
    "        <time>2020-10-13T22:45:48.359Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.780548\" lon=\"2.776045\">\n" +
    "        <ele>114.495683</ele>\n" +
    "        <time>2020-10-13T22:46:05.136Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.780391\" lon=\"2.776160\">\n" +
    "        <ele>114.339720</ele>\n" +
    "        <time>2020-10-13T22:46:07.181Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.779867\" lon=\"2.776544\">\n" +
    "        <ele>113.988815</ele>\n" +
    "        <time>2020-10-13T22:46:14.954Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.779357\" lon=\"2.776918\">\n" +
    "        <ele>113.712404</ele>\n" +
    "        <time>2020-10-13T22:46:22.392Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.778388\" lon=\"2.777621\">\n" +
    "        <ele>113.135152</ele>\n" +
    "        <time>2020-10-13T22:46:37.239Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.778080\" lon=\"2.777900\">\n" +
    "        <ele>112.886554</ele>\n" +
    "        <time>2020-10-13T22:46:41.820Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.777828\" lon=\"2.778238\">\n" +
    "        <ele>112.653462</ele>\n" +
    "        <time>2020-10-13T22:46:46.064Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.777451\" lon=\"2.778489\">\n" +
    "        <ele>112.368140</ele>\n" +
    "        <time>2020-10-13T22:46:51.232Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.776753\" lon=\"2.778616\">\n" +
    "        <ele>111.917145</ele>\n" +
    "        <time>2020-10-13T22:47:00.024Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.775362\" lon=\"2.778485\">\n" +
    "        <ele>111.138099</ele>\n" +
    "        <time>2020-10-13T22:47:18.236Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.775067\" lon=\"2.778342\">\n" +
    "        <ele>111.019669</ele>\n" +
    "        <time>2020-10-13T22:47:22.554Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.773852\" lon=\"2.777186\">\n" +
    "        <ele>110.666426</ele>\n" +
    "        <time>2020-10-13T22:47:42.777Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.772151\" lon=\"2.775302\">\n" +
    "        <ele>109.929234</ele>\n" +
    "        <time>2020-10-13T22:48:11.690Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.771959\" lon=\"2.775159\">\n" +
    "        <ele>109.788687</ele>\n" +
    "        <time>2020-10-13T22:48:14.591Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.771934\" lon=\"2.775155\">\n" +
    "        <ele>109.772168</ele>\n" +
    "        <time>2020-10-13T22:48:14.896Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.771890\" lon=\"2.775154\">\n" +
    "        <ele>109.743251</ele>\n" +
    "        <time>2020-10-13T22:48:15.510Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.770202\" lon=\"2.775823\">\n" +
    "        <ele>108.485234</ele>\n" +
    "        <time>2020-10-13T22:48:37.870Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.769414\" lon=\"2.775840\">\n" +
    "        <ele>107.713712</ele>\n" +
    "        <time>2020-10-13T22:48:47.289Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768772\" lon=\"2.775700\">\n" +
    "        <ele>107.078742</ele>\n" +
    "        <time>2020-10-13T22:48:54.979Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768944\" lon=\"2.777743\">\n" +
    "        <ele>107.020624</ele>\n" +
    "        <time>2020-10-13T22:49:20.468Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.769053\" lon=\"2.780011\">\n" +
    "        <ele>108.193888</ele>\n" +
    "        <time>2020-10-13T22:49:58.749Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768894\" lon=\"2.780567\">\n" +
    "        <ele>108.649153</ele>\n" +
    "        <time>2020-10-13T22:50:08.909Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768723\" lon=\"2.780770\">\n" +
    "        <ele>108.896606</ele>\n" +
    "        <time>2020-10-13T22:50:13.950Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768444\" lon=\"2.780829\">\n" +
    "        <ele>109.137739</ele>\n" +
    "        <time>2020-10-13T22:50:20.653Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768206\" lon=\"2.780986\">\n" +
    "        <ele>109.287440</ele>\n" +
    "        <time>2020-10-13T22:50:26.883Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768176\" lon=\"2.781044\">\n" +
    "        <ele>109.315470</ele>\n" +
    "        <time>2020-10-13T22:50:27.840Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768119\" lon=\"2.781155\">\n" +
    "        <ele>109.368968</ele>\n" +
    "        <time>2020-10-13T22:50:30.003Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768037\" lon=\"2.781316\">\n" +
    "        <ele>109.446325</ele>\n" +
    "        <time>2020-10-13T22:50:33.155Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.768027\" lon=\"2.781914\">\n" +
    "        <ele>109.673755</ele>\n" +
    "        <time>2020-10-13T22:50:42.092Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.767981\" lon=\"2.781960\">\n" +
    "        <ele>109.705535</ele>\n" +
    "        <time>2020-10-13T22:50:43.126Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.769176\" lon=\"2.784657\">\n" +
    "        <ele>110.916334</ele>\n" +
    "        <time>2020-10-13T22:51:30.027Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.769296\" lon=\"2.785136\">\n" +
    "        <ele>111.110679</ele>\n" +
    "        <time>2020-10-13T22:51:38.031Z</time>\n" +
    "      </trkpt>\n" +
    "      <trkpt lat=\"48.769576\" lon=\"2.787785\">\n" +
    "        <ele>113.159231</ele>\n" +
    "        <time>2020-10-13T22:52:22.365Z</time>\n" +
    "      </trkpt>\n" +
    "    </trkseg>\n" +
    "  </trk>\n" +
    "</gpx>";
}
