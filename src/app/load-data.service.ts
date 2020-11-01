import { Injectable } from '@angular/core';
import {NgxIndexedDBService} from "ngx-indexed-db";
import {Trace} from "./model/trace.model";

@Injectable({
  providedIn: 'root'
})
export class LoadDataService {

  constructor(private dbService: NgxIndexedDBService) { }

  getAllTraces(): Promise<Trace[]> {
    return this.dbService.getAll('traces');
  }

  saveTrace(feature) {
    this.dbService.add('traces', feature);
  }

  updateTrace(trace: Trace) {
    this.dbService.update('traces', trace);
  }

  deleteTrace(id: number) {
    this.dbService.delete("traces", id);
  }

  saveBuild(feature) {
    feature.build = true;
    this.saveTrace(feature);
  }

  getBuild(): Promise<Trace> {
    return this.dbService.getAll('traces')
      .then((list: Trace[]) => list.find(value => value.build));
  }

  deleteBuild(): Promise<any> {
    return this.getBuild()
      .then((trace: Trace) =>
        this.dbService.delete('traces', trace.id));
  }

  deleteDatabase() {
    return this.getAllTraces().then((all: Trace[]) =>
      all.forEach(t =>
        this.dbService.delete('traces', t.id)));
  }
}
