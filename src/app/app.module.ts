import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http";

import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import {PopUpService} from "./pop-up.service";

import {DBConfig, NgxIndexedDBModule} from 'ngx-indexed-db';
import {LoadDataService} from "./load-data.service";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatInputModule} from "@angular/material/input";
import {MatRadioModule} from "@angular/material/radio";
import {FormsModule} from "@angular/forms";

const dbConfig: DBConfig  = {
  name: 'DB_TRACES',
  version: 1,
  objectStoresMeta: [{
    store: 'traces',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'feature', keypath: 'feature', options: { unique: false} },
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
    PopUpService,
    LoadDataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
