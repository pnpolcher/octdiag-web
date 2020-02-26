import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataSource } from '@angular/cdk/collections';
import { Observable, empty } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

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
  displayedColumns = ['givenName', 'familyName', 'email', 'phoneNumber', 'userCreateDate', 'userLastModifiedDate'];

  constructor(private router: Router, private userService: UserService) {
    this.loading = true;
  }

  ngOnInit() {
  }

  openUserProfile(row: User) {
    this.router.navigate(['/home/user/profile', encodeURI(row.email)]);
  }
}

export class UserDataSource extends DataSource<any> {
  constructor(private userService: UserService, private controller: UsersComponent) {
    super();
  }

  connect(): Observable<User[]> {
    this.controller.loading = true;
    return this.userService.getAllUsers().pipe(finalize(() => this.controller.loading = false));
  }

  disconnect() {}
}
