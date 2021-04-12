require('@okta/env');

const { 
  CLIENT_ID,
  CLIENT_SECRET,
  ISSUER,
  OKTA_TESTING_DISABLEHTTPSCHECK = false,
} = process.env;

module.exports = {
  webServer: {
    port: 8080,
    oidc: {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      issuer: ISSUER,
      appBaseUrl: 'http://localhost:8080',
      scope: 'openid profile email',
      redirectUri: 'http://localhost:8080/login/callback',
      postLogoutRedirectUri: 'http://localhost:8080',
      testing: {
        disableHttpsCheck: OKTA_TESTING_DISABLEHTTPSCHECK
      }
    },
    resourceServer: {
      messagesUrl: 'http://localhost:8000/api/messages',
    },
  },
  resourceServer: {
    port: 8000,
    oidc: {
      clientId: CLIENT_ID,
      issuer: ISSUER,
      testing: {
        disableHttpsCheck: OKTA_TESTING_DISABLEHTTPSCHECK
      }
    },
    assertClaims: {
      aud: 'api://default',
      cid: CLIENT_ID
    }
  }
};