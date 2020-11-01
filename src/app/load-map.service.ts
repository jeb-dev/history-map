import { Injectable } from '@angular/core';
import {NgxIndexedDBService} from "ngx-indexed-db";
import {Trace} from "./model/trace.model";

@Injectable({
  providedIn: 'root'
})
export class LoadMapService {

  constructor(private dbService: NgxIndexedDBService) { }

  saveTrace(feature) {
    this.dbService.add('traces', feature);
  }

  getBuild(): Promise<Trace> {
    return this.dbService.getAll('traces')
      .then((list: Trace[]) => list.find(value => value.build));
  }
}
