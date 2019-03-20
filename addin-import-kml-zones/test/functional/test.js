const puppeteer = require('puppeteer');

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
        await page.goto('http://localhost:9000/');
    });

    after(async () => {
        await browser.close();
    });

    describe('Show addin content after initialized and focus is called', () => {
        it('should display root div', async () => {
            await page.waitFor('#importKmlZones', {
                visible: true
            });
        });
    });
});