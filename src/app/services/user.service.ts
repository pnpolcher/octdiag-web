import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set('content-type', 'application/json');
    return httpHeaders;
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(environment.baseApiUrl + 'users', {
      headers: this.getHeaders()
    });
  }

  getSingleUser(id: string): Observable<User> {
    return this.http.get<User>(environment.baseApiUrl + 'users?id=' + id, {
      headers: this.getHeaders()
    }).pipe(map(x => {
      return (Array.isArray(x) && x.length > 0) ? x[0] : null;
    }));
  }

  createUser(user: User): Observable<void> {
    return this.http.post<void>(environment.baseApiUrl + 'users', user, {
      headers: this.getHeaders()
    });
  }

  updateUser(user: User): Observable<void> {
    return this.http.put<void>(environment.baseApiUrl + 'users', user, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(environment.baseApiUrl + 'users?id=' + id, {
      headers: this.getHeaders()
    });
  }
}
