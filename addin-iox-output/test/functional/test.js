const puppeteer = require('puppeteer');
const mocks = require('./mocks/mocks.js');
const assert = require('chai').assert;

// JSON-RPC helpers
const rpcRequest = body => {
    const jsonRpc = 'JSON-RPC=';
    let payload = decodeURIComponent(body);
    if (payload.startsWith(jsonRpc)) {
        payload = payload.substring(jsonRpc.length, payload.length);
    }
    return JSON.parse(payload);
};

const rpcResponse = (response, err) => {
    return {
        id: -1,
        result: response,
        error: err
    };
};

// puppeteer options
const opts = {
    headless: true,
    slowMo: 0,
    timeout: 10000
};

// test
describe('User visits addin', async () => {
    let browser;
    let page;

    // open page
    before(async () => {
        browser = await puppeteer.launch(opts);

        page = await browser.newPage();
        await page.setRequestInterception(true);

        // setup mocks
        page.on('request', request => {
            if (request.url() === `https://${mocks.server}/apiv1`) {

                let rpcBody = rpcRequest(request.postData());
                let payload = '';

                switch (rpcBody.method) {
                    case 'Authenticate':
                        payload = mocks.credentials;
                        break;
                    case 'Get':
                        switch (rpcBody.params.typeName) {
                            case 'Device':
                                payload = [mocks.device];
                                break;
                        }
                }

                request.respond({
                    content: 'application/json',
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify(rpcResponse(payload))
                });
            } else {
                request.continue();
            }
        });

        await page.goto('http://localhost:9000/');

        await page.waitFor('#loginDialog');
        await page.type('#email', mocks.login.userName);
        await page.type('#password', mocks.login.password);
        await page.type('#database', mocks.login.database);
        await page.type('#server', mocks.server);
        await page.click('#loginBtn');
    });

    after(async () => {
        await browser.close();
    });

    describe('Show addin content after initialized and focus is called', () => {
        it('should display root div', async () => {
            await page.waitFor('#ioxoutput', {
                visible: true
              });
        });

        it('should display device', async () => {
            const elDevice = await page.$('#ioxoutput-vehicles > option');
            assert.isNotNull(elDevice);
            const text = await page.evaluate(elDevice => elDevice.textContent, elDevice);
            assert.equal(mocks.device.name, text.trim());
        });
      });
});
