declare module 'sendmail';
declare module 'archiver-promise';

// declare module 'express' {
//   interface Request extends Request {
//     file: any;
//   }
// }

declare module 'validator' {
  export namespace ValidatorJS {
    export interface ValidatorStatic {
      validateUser(username: string): string
    }
  }
}