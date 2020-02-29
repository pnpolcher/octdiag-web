import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { Observable } from 'rxjs';

import { UserService } from '../services/user.service';
import { finalize, switchMap } from 'rxjs/operators';
import { User } from '../model/User';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  user$: Observable<User>;
  username: string;
  loading = false;

  userForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    familyName: new FormControl('', [
      Validators.required
    ]),
    givenName: new FormControl('', [
      Validators.required
    ]),
    phoneNumber: new FormControl('', [
      Validators.required
    ])
  });

  constructor(private router: Router, private route: ActivatedRoute, private userService: UserService) {
    this.loading = true;
  }

  ngOnInit() {
    this.user$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        this.userService.getSingleUser(decodeURI(params.get('id'))).pipe(finalize(() => this.loading = false)))
    );

    this.user$.subscribe(x => {
      this.userForm.setValue({
        email: x.email !== undefined ? x.email : '',
        familyName: x.familyName !== undefined ? x.familyName : '',
        givenName: x.givenName !== undefined ? x.givenName : '',
        phoneNumber: x.phoneNumber !== undefined ? x.phoneNumber : ''
      });
      this.username = x.username;
    });
  }

  onSave() {
    const user = new User();
    user.username = this.username;
    user.email = this.userForm.get('email').value;
    user.familyName = this.userForm.get('familyName').value;
    user.givenName = this.userForm.get('givenName').value;
    user.phoneNumber = this.userForm.get('phoneNumber').value;

    this.userService.updateUser(user).subscribe();
    this.router.navigate(['/home/users']);
  }
}
