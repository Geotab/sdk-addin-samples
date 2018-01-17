const Browser = require('zombie');
const nock = require('nock');
const mocks = require('./mocks/mocks.js');

// JSON-RPC helpers
var rpcRequest = function (body) {
  return JSON.parse(body['JSON-RPC']);
};

var rpcResponse = function (response, err) {
  return {
    id: -1,
    result: response,
    error: err
  };
};

// Mocks
var mockServer = mocks.server;

var nockApi = nock('https://' + mockServer);

nockApi
  .post('/apiv1', function (body) {
    var request = rpcRequest(body);
    return request.method === 'Authenticate';
  })
  .reply(200, rpcResponse(mocks.credentials))
  .post('/apiv1', function (body) {
    var request = rpcRequest(body);
    return request.method === 'Get' && request.params.typeName === 'Device';
  })
  .reply(200, rpcResponse([mocks.device]))
  .post('/apiv1', function (body) {
    var request = rpcRequest(body);
    return request.method === 'Get' && request.params.typeName === 'User';
  })
  .reply(200, rpcResponse([mocks.user]));

Browser.localhost(mockServer, 9000);

describe('User visits addin', function () {

  const browser = new Browser({
    runScripts: false
  });

  // to enable zombie debugging, uncomment this line
  // browser.debug();

  // open page
  before(function (done) {
    return browser.visit('/', done);
  });

  // login (only part of local add-in debugging)
  before(function (done) {
    browser
      .fill('Email', mocks.login.userName)
      .fill('Password', mocks.login.password)
      .fill('Database', mocks.login.database)
      .fill('Server', mockServer)
      .clickLink('Login', done);
  });

  

  it('should be loaded', function () {
    browser.assert.success();
  });

  describe('Show addin content after initialized and focus is called', function () {
    it('should display root div', function () {
      browser.assert.style('#heatmap', 'display', '');
    });
  });

});
