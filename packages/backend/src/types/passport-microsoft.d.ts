declare module 'passport-microsoft' {
  import { Strategy as OAuth2Strategy } from 'passport-oauth2';

  interface MicrosoftStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    tenant?: string;
    authorizationURL?: string;
    tokenURL?: string;
    addUPNAsEmail?: boolean;
  }

  interface MicrosoftProfile {
    id: string;
    displayName: string;
    emails?: Array<{ type: string; value: string }>;
    _json: {
      userPrincipalName?: string;
      mail?: string;
    };
  }

  type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: MicrosoftProfile,
    done: (err: Error | null, user?: Express.User | false) => void
  ) => void;

  class Strategy extends OAuth2Strategy {
    constructor(options: MicrosoftStrategyOptions, verify: VerifyCallback);
    name: string;
  }
}
