import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataPoint } from '../model/data-point';
import { UserService } from './user.service';

@Injectable()
export class DataService {
  private readonly dataURL: string = '/init'

  private _dataPoints: Observable<DataPoint[]>;

  constructor(private http: HttpClient, private userService: UserService) {
  }

  get dataPoints(): Observable<DataPoint[]> {
    return this._dataPoints;
  }

  loadData() {
    this._dataPoints = <Observable<DataPoint[]>>this.http.get(this.dataURL, { headers: { 'token': this.userService.token } });
  }
}
