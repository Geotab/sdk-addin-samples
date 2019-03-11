const rison = require('rison');
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
    slowMo: 10,
    timeout: 10000
};

// test
describe('User visits addin', async () => {
    const vehicleId = '(id:b1)';
    let browser;
    let page;

    // open page
    before(async () => {
        browser = await puppeteer.launch(opts);
        page = await browser.newPage();

        await page.setRequestInterception(true);

        // setup mocks
        page.on('request', request => {
            if (request.url() === `http://${mocks.server}/apiv1`) {

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
                            case 'User':
                                payload = [mocks.user];
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
    });

    after(async () => {
        await browser.close();
    });

    describe('Show addin content after initialized and focus is called', async() => {
        it('should display button', async () => {
            await page.waitFor('.customButton ', {
                visible: true
            });
        });

        it('should display message when no vehicle selected ', async () => {
            await page.click('.customButton');

            let elButton = await page.$('#engineDataButton-addin');
            assert.isNotNull(elButton);
        });

        it('should redirect to engine data profile page ', async () => {
            await page.goto(`http://localhost:9000/#${vehicleId}`);

            await page.click('.customButton');

            let hash = await page.evaluate('location.hash');;
            let hashValues = rison.decode(hash.substring(1, hash.length));

            assert.isNotNull(hashValues.dateRange);
            assert.isNotNull(hashValues.dateRange.startDate);
            assert.isNotNull(hashValues.dateRange.endDate);
            assert.equal('b1', hashValues.device);
            assert.deepEqual(['DiagnosticEngineSpeedId', 'DiagnosticGoDeviceVoltageId', 'DiagnosticDeviceTotalFuelId'], hashValues.diagnostic);
        });
    });
});
