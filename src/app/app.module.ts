import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http";

import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import {MarkerService} from "./marker.service";
import {PopUpService} from "./pop-up.service";

import {DBConfig, NgxIndexedDBModule} from 'ngx-indexed-db';
import {LoadMapService} from "./load-map.service";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatInputModule} from "@angular/material/input";
import {MatRadioModule} from "@angular/material/radio";
import {FormsModule} from "@angular/forms";

const dbConfig: DBConfig  = {
  name: 'DB_PLACES',
  version: 1,
  objectStoresMeta: [{
    store: 'places',
    storeConfig: { keyPath: 'id', autoIncrement: false },
    storeSchema: [
      { name: 'id', keypath: 'id', options: { unique: true} },
      { name: 'longitude', keypath: 'longitude', options: { unique: false} },
      { name: 'latitude', keypath: 'latitude', options: { unique: false} },
      { name: 'name', keypath: 'name', options: { unique: false} },
      { name: 'address', keypath: 'address', options: { unique: false} },
      { name: 'visits', keypath: 'visits', options: { unique: false} },
    ]
  },{
    store: 'visits',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'placeId', keypath: 'placeId', options: { unique: false} },
      { name: 'arrivedDate', keypath: 'arrivedDate', options: { unique: true} },
      { name: 'durationStay', keypath: 'durationStay', options: { unique: false} },
    ]
  }]
};

@NgModule({
  declarations: [
    AppComponent,
    MapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgxIndexedDBModule.forRoot(dbConfig),
    BrowserAnimationsModule, MatCardModule, MatButtonModule, MatInputModule,
    ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}), MatRadioModule, FormsModule
  ],
  providers: [
    MarkerService,
    PopUpService,
    LoadMapService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
