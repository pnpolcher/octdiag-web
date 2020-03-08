import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { DiagnoseResponse } from '../model/diagnose-response';


@Injectable({
  providedIn: 'root'
})
export class DiagnoseService {

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();

    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  diagnose(notes: string): Observable<DiagnoseResponse> {
    return this.http.post<DiagnoseResponse>(environment.baseApiUrl + 'diagnose', {
      notes
    }, {
      headers: this.getHeaders()
    });
  }
}
