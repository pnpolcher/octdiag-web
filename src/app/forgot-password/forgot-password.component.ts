import { Component, OnInit } from '@angular/core';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CognitoAuthErrors, LoginService } from '../services/login.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  forgotPasswordMessage = '';

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ])
  });

  verificationCodeForm = new FormGroup({
    verificationCode: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{6}$/g)
    ]),
    password: new FormControl('', [
      Validators.required,
    ]),
    confirmPassword: new FormControl('', [
      Validators.required
    ])
  });

  verificationCodeExpected = false;
  loading = false;
  forgotPasswordError = false;

  constructor(private loginService: LoginService, private router: Router) { }

  ngOnInit() {
  }

  onForgotPassword() {

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    this.forgotPasswordError = false;
    this.loginService.forgotPassword(
      this.forgotPasswordForm.get('email').value,
      this.onForgotPasswordSuccess,
      this.onForgotPasswordFailure,
      this.onInputVerificationCode,
      this);
  }

  onForgotPasswordSuccess(that: any) {
    that.loading = false;
    that.router.navigate(['/login']);
  }

  onForgotPasswordFailure(that: any, errCode: CognitoAuthErrors) {
    that.forgotPasswordError = true;

    switch (errCode) {
      case CognitoAuthErrors.CODE_MISMATCH:
        that.forgotPasswordMessage = 'Invalid verification code';
        break;
      case CognitoAuthErrors.LIMIT_EXCEEDED:
        that.forgotPasswordMessage = 'Exceeded number of attempts';
        break;
      case CognitoAuthErrors.INVALID_PARAMETER:
        that.forgotPasswordMessage = 'Invalid password';
        break;
      default:
        that.forgotPasswordMessage = 'Unexpected error';
    }

    that.loading = false;
  }

  onInputVerificationCode(that: any) {
    that.verificationCodeExpected = true;
    that.loading = false;
  }

  onVerificationCodeEntered() {
    if (this.verificationCodeForm.invalid) {
      return;
    }

    this.loading = true;
    this.loginService.confirmPassword(
      this.verificationCodeForm.get('verificationCode').value,
      this.verificationCodeForm.get('password').value
    );
  }
}
