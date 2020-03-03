import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FormControl, FormGroup, Validators } from '@angular/forms';

import { CognitoAuthErrors, LoginService } from '../services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {

  buttonText = 'Login';

  newPasswordRequired: boolean;
  mfaRequired: boolean;
  userAttributes: any;
  requiredAttributes: any;

  loading = false;
  loginError = false;

  loginForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      Validators.minLength(3)
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8)
    ]),
  });

  newPasswordForm = new FormGroup({
    password: new FormControl('', [
      Validators.required
    ]),
    repeatPassword: new FormControl('', [
      Validators.required
    ])
  });

  mfaForm = new FormGroup({
    mfaCode: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{6}$/g)
    ])
  });

  constructor(private loginService: LoginService, private router: Router) {
    this.newPasswordRequired = false;
    this.mfaRequired = false;
  }

  ngOnInit() {
  }

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.loginError = false;

    this.loginService.login(
      this.loginForm.get('username').value,
      this.loginForm.get('password').value,
      this.onLoginSuccess,
      this.onLoginFailure,
      this.onMfaRequired,
      this.onNewPasswordRequired,
      this);
  }

  onLoginSuccess(that: any) {
    that.loading = false;
    that.loginError = false;
    that.router.navigate(['home']);
  }

  onLoginFailure(that: any, errCode: CognitoAuthErrors) {
    console.log('Component onLoginFailure: ' + errCode.toString());
    that.loading = false;
    that.loginError = true;
  }

  onMfaRequired(that: any) {
    console.log('onMfaRequired');
    that.loading = false;
    that.mfaRequired = true;
  }

  onMfaCodeProvided() {
    console.log('onMfaCodeProvided');
    this.loading = true;
    const mfaCode = this.mfaForm.get('mfaCode').value.toString().trim();
    this.loginService.completeMfaChallenge(mfaCode);
  }

  onNewPasswordRequired(that: any, userAttributes: any, requiredAttributes: any) {
    that.loading = false;
    that.mfaRequired = false;
    that.newPasswordRequired = true;
    that.userAttributes = userAttributes;
    that.requiredAttributes = requiredAttributes;
  }

  onNewPasswordProvided() {
    if (this.newPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    this.loginService.completeNewPasswordChallenge(
      this.newPasswordForm.get('password').value);
  }
}
