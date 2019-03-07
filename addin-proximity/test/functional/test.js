const Browser = require('zombie');
const nock = require('nock');
const mocks = require('./mocks/mocks.js');

// JSON-RPC helpers
const rpcRequest = body => {
    return JSON.parse(body['JSON-RPC']);
};

const rpcResponse = (response, err) => {
    return {
        id: -1,
        result: response,
        error: err
    };
};

// Mocks
const mockServer = mocks.server;
const responseHeaders = {
    'Access-Control-Allow-Origin': '*'
};
const nockApi = nock('http://' + mockServer);

nockApi
    .post('/apiv1', body => {
        var request = rpcRequest(body);
        return request.method === 'Authenticate';
    })
    .reply(200, rpcResponse(mocks.credentials), responseHeaders)
    .post('/apiv1', body => {
        var request = rpcRequest(body);
        return request.method === 'Get' && request.params.typeName === 'Device';
    })
    .reply(200, rpcResponse([mocks.device]), responseHeaders)
    .post('/apiv1', body => {
        var request = rpcRequest(body);
        return request.method === 'Get' && request.params.typeName === 'User';
    })
    .reply(200, rpcResponse([mocks.user]), responseHeaders);

// test
describe('User visits addin', () => {

    const browser = new Browser();

    // to enable zombie debugging, uncomment this line
    // browser.debug();

    // open page
    before(done => {
        return browser.visit('http://localhost:9000/', done);
    });

    // login (only part of local add-in debugging)
    before(done => {
        browser.fill('Email', mocks.login.userName);
        browser.fill('Password', mocks.login.password);
        browser.fill('Database', mocks.login.database);
        browser.fill('Server', mockServer);
        browser.clickLink('Login', done);
    });

    it('should be loaded', () => {
        browser.assert.success();
    });

    describe('Show addin content after initialized and focus is called', () => {
        it('should display root div', () => {
            browser.assert.style('#proximity', 'display', '');
        });

        it('should display device', () => {
            browser.assert.text('.choices__item', mocks.device.name);
        });
    });

});
