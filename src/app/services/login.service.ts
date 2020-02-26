import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';

const ACCESS_TOKEN_KEY = 'accessToken';
const ID_TOKEN_KEY = 'idToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export enum CognitoAuthErrors {
  NONE,
  NOT_AUTHORIZED,
  CODE_MISMATCH,
  INVALID_PARAMETER,
  LIMIT_EXCEEDED,
  UNEXPECTED,
}


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  userPool: AmazonCognitoIdentity.CognitoUserPool;
  cognitoUser: AmazonCognitoIdentity.CognitoUser = null;
  loginCallbacks: any;
  forgotPasswordCallbacks: any;

  requiresPasswordChange = false;
  userAttributes: any;

  cognitoSession: AmazonCognitoIdentity.CognitoUserSession = null;

  constructor() {
    this.userPool = new AmazonCognitoIdentity.CognitoUserPool(environment.cognitoUserPoolData);
  }

  login(
    username: string,
    password: string,
    onSuccessCallback: (that: any) => void,
    onFailureCallback: (that: any, errCode: CognitoAuthErrors) => void,
    onMfaRequiredCallback: (that: any) => void,
    onNewPasswordRequiredCallback: (that: any, userAttributes: any, requiredAttributes: any) => void,
    controller: any) {

    if (this.cognitoUser != null) {
      return;
    }

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: username,
      Password: password
    });

    this.cognitoUser = new AmazonCognitoIdentity.CognitoUser({
      Username: username,
      Pool: this.userPool
    });

    this.loginCallbacks = {
      onSuccess: (session) => this.onLoginSuccess(session, onSuccessCallback, controller),
      onFailure: (err) => this.onLoginFailure(err, onFailureCallback, controller),
      mfaRequired: (details) => this.onLoginMfaRequired(details, onMfaRequiredCallback, controller),
      newPasswordRequired: (userAttributes: any, requiredAttributes: any) =>
        this.onLoginNewPasswordRequired(
          userAttributes,
          requiredAttributes,
          onNewPasswordRequiredCallback,
          controller),
    };

    this.cognitoUser.authenticateUser(authenticationDetails, this.loginCallbacks);
  }

  onLoginSuccess(
    session: AmazonCognitoIdentity.CognitoUserSession,
    onSuccessCallback: (that: any) => void,
    controller: any) {

    this.cognitoUser = null;
    this.cognitoSession = session;
    onSuccessCallback(controller);
  }

  onLoginFailure(
    err,
    onFailureCallback: (that: any, errCode: CognitoAuthErrors) => void,
    controller: any) {

    let authFailedCode: CognitoAuthErrors;
    this.cognitoUser = null;

    switch (err.code) {
      case 'NotAuthorizedException':
        authFailedCode = CognitoAuthErrors.NOT_AUTHORIZED;
        break;

      default:
        authFailedCode = CognitoAuthErrors.UNEXPECTED;
        break;
    }

    onFailureCallback(controller, authFailedCode);
  }

  onLoginMfaRequired(details, onMfaRequiredCallback: (that: any) => void, controller: any) {
    onMfaRequiredCallback(controller);
  }

  completeMfaChallenge(verificationCode: string) {
    this.cognitoUser.sendMFACode(verificationCode, this.loginCallbacks);
  }

  onLoginNewPasswordRequired(
    userAttributes: any,
    requiredAttributes: any,
    onNewPasswordRequiredCallback: (that: any, userAttributes: any, requiredAttributes: any) => void,
    controller: any) {
    // User was signed up by an admin and must provide new
    // password and required attributes, if any, to complete
    // authentication.

    // userAttributes: object, which is the user's current profile. It will list all attributes that are associated with the user. 
    // Required attributes according to schema, which don’t have any values yet, will have blank values.
    // requiredAttributes: list of attributes that must be set by the user along with new password to complete the sign-in.

    // Get these details and call.
    // newPassword: password that user has given
    // attributesData: object with key as attribute name and value that the user has given.

    delete userAttributes.email_verified;
    delete userAttributes.phone_number_verified;
    this.userAttributes = userAttributes;
    this.requiresPasswordChange = true;
    onNewPasswordRequiredCallback(controller, this.userAttributes, requiredAttributes);
  }

  /**
   * Completes the new password challenge.
   *
   * @param newPassword The new password to assign to the user.
   */
  completeNewPasswordChallenge(newPassword: string) {
    this.cognitoUser.completeNewPasswordChallenge(newPassword, this.userAttributes, this.loginCallbacks);
  }

  forgotPassword(
    username: string,
    onSuccessCallback: (that: any) => void,
    onFailureCallback: (that: any, errCode: CognitoAuthErrors) => void,
    onInputVerificationCode: (that: any) => void,
    controller: any) {

    if (this.cognitoUser != null) {
      return;
    }

    this.forgotPasswordCallbacks = {
      onSuccess: () => this.forgotPasswordSuccess(username, onSuccessCallback, controller),
      onFailure: (err) => this.forgotPasswordFailure(err, onFailureCallback, controller),
      inputVerificationCode: () => this.onInputVerificationCode(onInputVerificationCode, controller),
    }

    this.cognitoUser = new AmazonCognitoIdentity.CognitoUser({
      Username: username,
      Pool: this.userPool
    });

    this.cognitoUser.forgotPassword(this.forgotPasswordCallbacks);
  }

  forgotPasswordSuccess(username: string, onSuccessCallback: (that: any) => void, controller: any) {
    this.cognitoUser = null;
    onSuccessCallback(controller);
  }

  forgotPasswordFailure(
    err: any,
    onFailureCallback: (that: any, errCode: CognitoAuthErrors) => void,
    controller: any) {

    let errCode;

    switch (err.code) {
      case 'CodeMismatchException':
        errCode = CognitoAuthErrors.CODE_MISMATCH;
        break;

      case 'InvalidParameterException':
        errCode = CognitoAuthErrors.INVALID_PARAMETER;
        break;

      case 'LimitExceededException':
        errCode = CognitoAuthErrors.LIMIT_EXCEEDED;
        break;

      default:
        errCode = CognitoAuthErrors.UNEXPECTED;
        break;
    }

    onFailureCallback(controller, errCode);
  }

  onInputVerificationCode(onInputVerificationCode: (that: any) => void, controller: any) {
    onInputVerificationCode(controller);
  }

  confirmPassword(verificationCode: string, password: string) {
    this.cognitoUser.confirmPassword(verificationCode, password, this.forgotPasswordCallbacks);
  }

  /*
  private completeNewPasswordChallengeSuccess(
    session: AmazonCognitoIdentity.CognitoUserSession,
    onSuccessCallback: (that: any, session: AmazonCognitoIdentity.CognitoUserSession) => void,
    controller: any) {

    onSuccessCallback(session, controller);
  }

  private completeNewPasswordChallengeFailure(
    err: any,
    onFailureCallback: (that: any, errCode: CognitoAuthErrors) => void,
    controller: any) {

    let errCode;

    switch (err.code) {
      case 'CodeMismatchException':
        errCode = CognitoAuthErrors.CODE_MISMATCH;
        break;

      case 'InvalidParameterException':
        errCode = CognitoAuthErrors.INVALID_PARAMETER;
        break;

      case 'LimitExceededException':
        errCode = CognitoAuthErrors.LIMIT_EXCEEDED;
        break;

      default:
        errCode = CognitoAuthErrors.UNEXPECTED;
        break;
    }

    onFailureCallback(controller, errCode);
  }
  */

  getIdToken(): string {
    const lastAuthUser =
      localStorage.getItem(
        'CognitoIdentityServiceProvider.' +
        environment.cognitoAppClient +
        '.LastAuthUser');
    const token = localStorage.getItem(
      'CognitoIdentityServiceProvider.' +
      environment.cognitoAppClient + '.' +
      lastAuthUser + '.idToken');
    return token;
  }
}
