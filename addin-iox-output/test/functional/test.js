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
    console.log(request);
  });

describe('User visits addin', function () {

  const browser = new Browser();

  // to enable zombie debugging, uncomment this line
  // browser.debug();

  // open page
  before(function (done) {
    return browser.visit('http://localhost:9000/', done);
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
      browser.assert.style('#ioxOutput', 'display', '');
    });
  });

});
