import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    });
  }

  createUser(user: User): void {
    this.http.post(environment.baseApiUrl + 'users', user, {
      headers: this.getHeaders()
    });
  }

  updateUser(user: User): void {
    this.http.put(environment.baseApiUrl + 'users', user, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: string): void {
    this.http.delete(environment.baseApiUrl + 'users?id=' + id, {
      headers: this.getHeaders()
    });
  }
}
