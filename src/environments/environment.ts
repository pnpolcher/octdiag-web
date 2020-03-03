// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  cognitoAppClient: '37iii7ghck019vlptb8kdo1tdt',
  cognitoIdentityPoolId: 'eu-west-1:225d3c5f-7497-4559-9e9d-52784609c1ee',
  baseApiUrl: 'https://8dd164dpi9.execute-api.eu-west-1.amazonaws.com/dev/',
  cognitoUserPoolData: {
    ClientId: '37iii7ghck019vlptb8kdo1tdt',
    Region: 'eu-west-1',
    UserPoolId: 'eu-west-1_pYt9yFwuU',
  },
  transcribeMedicalData: {
    region: 'eu-west-1'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
