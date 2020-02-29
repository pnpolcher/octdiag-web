import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

import { User } from '../model/User';

import { UserService } from '../services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  loading = false;
  dataSource = new UserDataSource(this.userService, this);
  displayedColumns = [
    'username',
    'givenName',
    'familyName',
    'email',
    'phoneNumber',
    'userCreateDate',
    'userLastModifiedDate',
    'actions'
  ];

  constructor(private router: Router, private userService: UserService) {
    this.loading = true;
  }

  ngOnInit() {
    this.dataSource.loadUsers();
  }

  openUserProfile(row: User) {
    this.router.navigate(['/home/user/profile', encodeURI(row.username)]);
  }

  deleteUser(event: any, username: string) {
    if (confirm('Are you sure you want to delete the user?') === true) {
      this.userService.deleteUser(username).pipe(finalize(() => {
        this.dataSource.loadUsers();
      })).subscribe();
    }
    event.stopPropagation();
    // this.router.navigate(['/home/users']);
  }
}

export class UserDataSource extends DataSource<any> {

  private usersSubject = new BehaviorSubject<User[]>([]);

  constructor(private userService: UserService, private controller: UsersComponent) {
    super();
  }

  connect(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  disconnect() {
    this.usersSubject.complete();
  }

  loadUsers() {
    this.controller.loading = true;
    return this.userService.getAllUsers().pipe(
      catchError(() => of([])),
      finalize(() => this.controller.loading = false))
      .subscribe(users => this.usersSubject.next(users));
  }
}
