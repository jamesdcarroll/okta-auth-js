import { OktaAuth } from '@okta/okta-auth-js';
import {
  EmailTransaction,
  EmailChallengeTransaction,
  BaseTransaction
} from '../../../lib/myaccount/transactions';
import { AuthApiError } from '../../../lib/errors';
import { sendRequest, generateRequestFnFromLinks } from '../../../lib/myaccount/request';

jest.mock('../../../lib/http', () => {
  const actual = jest.requireActual('../../../lib/http');
  return {
    ...actual,
    httpRequest: () => { }
  };
});
jest.mock('../../../lib/oidc', () => {
  const actual = jest.requireActual('../../../lib/oidc');
  return {
    ...actual,
    getWithRedirect: () => { },
    decodeToken: () => { }
  };
});
jest.mock('../../../lib/myaccount/transactions/EmailTransaction');
jest.mock('../../../lib/myaccount/transactions/EmailStatusTransaction');
jest.mock('../../../lib/myaccount/transactions/EmailChallengeTransaction');
jest.mock('../../../lib/myaccount/transactions/Base');

const mocked = {
  http: require('../../../lib/http'),
  oidc: require('../../../lib/oidc')
};

// happy paths is covered by the upper level api methods
// only test error cases here
describe('sendRequest', () => {
  let auth;
  beforeEach(function () {
    const issuer = 'http://my-okta-domain';
    auth = new OktaAuth({ issuer, pkce: false });
    auth.tokenManager.getTokensSync = jest.fn().mockReturnValue({
      idToken: { idToken: 'fake-idToken' },
      accessToken: { accessToken: 'fake-idToken' }
    });
    auth._oktaUserAgent.getHttpHeader = jest.fn().mockReturnValue({
      'X-Okta-User-Agent-Extended': 'fake-okta-ua'
    });
  });

  it('throws AuthApiError', async () => {
    const error = new AuthApiError({
      errorSummary: 'fake-error'
    });
    jest.spyOn(mocked.http, 'httpRequest').mockRejectedValue(error);
    jest.spyOn(mocked.oidc, 'getWithRedirect');
    try {
      await sendRequest(auth, {
        url: 'https://fake-url.com',
        method: 'GET',
        accessToken: 'fake-token'
      });
    } catch (err) {
      expect(err).toBe(error);
      expect(mocked.oidc.getWithRedirect).not.toHaveBeenCalled();
    }
  });
});

describe('generateRequestFnFromLinks function', () => {
  let auth;

  const mockLinks = {
    'self': {
      'href': 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3',
      'hints': {
        'allow': [
          'GET',
          'PUT',
          'DELETE'
        ]
      }
    },
    'challenge': {
      'href': 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3/challenge',
      'hints': {
        'allow': [
          'POST'
        ]
      }
    },
    'verify': {
      'href': 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3/verify',
      'hints': {
        'allow': [
          'POST'
        ]
      }
    },
  };

  beforeEach(function () {
    const issuer = 'http://my-okta-domain';
    auth = new OktaAuth({ issuer, pkce: false });
    jest.spyOn(mocked.http, 'httpRequest').mockResolvedValue({
      fake: 'fake-response'
    });
  });

  describe('Generate CRUD function based on "self" link', () => {

    it('can resolve transaction based on "transactionClassName"', async () => {
      const getFn = generateRequestFnFromLinks({
        oktaAuth: auth,
        accessToken: 'fake-token',
        methodName: 'get',
        links: mockLinks,
        transactionClassName: 'EmailTransaction'
      });
      await getFn();
      expect(mocked.http.httpRequest).toHaveBeenCalledWith(auth, {
        url: 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3',
        method: 'GET',
        accessToken: 'fake-token',
        headers: {
          Accept: '*/*;okta-version=1.0.0'
        }
      });
      expect(EmailTransaction).toHaveBeenCalledWith(auth, expect.objectContaining({
        accessToken: 'fake-token',
        res: expect.objectContaining({
          fake: 'fake-response'
        }),
      }));
    });

    it('resolves BaseTransaction if no "transactionClassName" is provided', async () => {
      const getFn = generateRequestFnFromLinks({
        oktaAuth: auth,
        accessToken: 'fake-token',
        methodName: 'get',
        links: mockLinks,
      });
      await getFn();
      expect(mocked.http.httpRequest).toHaveBeenCalledWith(auth, {
        method: 'GET',
        url: 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3',
        accessToken: 'fake-token',
        headers: {
          Accept: '*/*;okta-version=1.0.0',
        }
      });
      expect(BaseTransaction).toHaveBeenCalledWith(auth, expect.objectContaining({
        accessToken: 'fake-token',
        res: expect.objectContaining({
          fake: 'fake-response'
        }),
      }));
    });
  });

  describe('Generate other functions - first level fields', () => {

    it('can resolve transaction based on "transactionClassName"', async () => {
      const challengeFn = generateRequestFnFromLinks({
        oktaAuth: auth,
        accessToken: 'fake-token',
        methodName: 'challenge',
        links: mockLinks,
        transactionClassName: 'EmailChallengeTransaction'
      });
      await challengeFn();
      expect(mocked.http.httpRequest).toHaveBeenCalledWith(auth, {
        method: 'POST',
        url: 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3/challenge',
        accessToken: 'fake-token',
        headers: {
          Accept: '*/*;okta-version=1.0.0',
        },
      });
      expect(EmailChallengeTransaction).toHaveBeenCalledWith(auth, expect.objectContaining({
        accessToken: 'fake-token',
        res: expect.objectContaining({
          fake: 'fake-response'
        }),
      }));
    });

    it('resolves BaseTransaction if no "transactionClassName" is provided', async () => {
      const challengeFn = generateRequestFnFromLinks({
        oktaAuth: auth,
        accessToken: 'fake-token',
        methodName: 'challenge',
        links: mockLinks,
      });
      await challengeFn();
      expect(mocked.http.httpRequest).toHaveBeenCalledWith(auth, {
        method: 'POST',
        url: 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3/challenge',
        accessToken: 'fake-token',
        headers: {
          Accept: '*/*;okta-version=1.0.0',
        }
      });
      expect(BaseTransaction).toHaveBeenCalledWith(auth, expect.objectContaining({
        accessToken: 'fake-token',
        res: expect.objectContaining({
          fake: 'fake-response'
        }),
      }));
    });
  });

  it('can pass payload to generated function', async () => {
    const verifyFn = generateRequestFnFromLinks({
      oktaAuth: auth,
      accessToken: 'fake-token',
      methodName: 'verify',
      links: mockLinks,
    });
    await verifyFn({ verificationCode: '000000' });
    expect(mocked.http.httpRequest).toHaveBeenCalledWith(auth, {
      method: 'POST',
      url: 'http://my-okta-domain/idp/myaccount/emails/00T196qTp3LIMZQ0L0g3/verify',
      accessToken: 'fake-token',
      headers: {
        Accept: '*/*;okta-version=1.0.0'
      },
      args: { verificationCode: '000000' },
    });
    expect(BaseTransaction).toHaveBeenCalledWith(auth, expect.objectContaining({
      accessToken: 'fake-token',
      res: expect.objectContaining({
        fake: 'fake-response'
      }),
    }));
  });

});
