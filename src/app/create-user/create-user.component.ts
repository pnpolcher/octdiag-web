import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../model/User';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit {

  loading = false;

  userForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    givenName: new FormControl('', [
      Validators.required,
    ]),
    familyName: new FormControl('', [
      Validators.required,
    ]),
    phoneNumber: new FormControl('', [
      Validators.required,
    ]),
  });

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit(): void {
  }

  onSave() {
    const user = new User();

    user.username = this.userForm.get('username').value;
    user.email = this.userForm.get('email').value;
    user.givenName = this.userForm.get('givenName').value;
    user.familyName = this.userForm.get('familyName').value;
    user.phoneNumber = this.userForm.get('phoneNumber').value;

    this.userService.createUser(user).subscribe();
    this.router.navigate(['/home/users']);
  }

}
