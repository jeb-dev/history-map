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
    NgxIndexedDBModule.forRoot(dbConfig)
  ],
  providers: [
    MarkerService,
    PopUpService,
    LoadMapService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
