const puppeteer = require('puppeteer');
const mocks = require('./mocks/mocks.js');
const assert = require('chai').assert;

// JSON-RPC helpers
const rpcRequest = body => {
    let decodedBody = decodeURIComponent(body);
    let json = decodedBody.replace('JSON-RPC=', '');
    return JSON.parse(json);
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
describe('User visits addin', () => {

    let browser,
        page;

    // Open Page
    before(async () => {
        browser = await puppeteer.launch(opts);
        page = await browser.newPage();
        // Allowing puppeteer access to the request - needed for mocks
        await page.setRequestInterception(true);

        // Setup mocks
        await page.on('request', request => {
            if (request.url() === `http://${mocks.server}/apiv1`) {

                let rpcBody = rpcRequest(request.postData());
                let payload = '';

                switch (rpcBody.method) {
                    case 'Authenticate':
                        payload = mocks.credentials;
                        break;
                    case 'Get':
                        switch (rpcBody.params.typeName) {
                            case 'Group':
                                payload = mocks.groups;
                                break;
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

        // Login
        await page.goto('http://localhost:9000/');
        let loggedIn = await page.evaluate( () => {
            let dialogWindow = document.getElementById('loginDialog');
            return (dialogWindow.style.display = 'none' ? true : false);

        })
        if(loggedIn){
            await page.click('#logoutBtn');
        }
        await page.waitForSelector('#loginDialog');
        await page.type('#email', mocks.login.userName);
        await page.type('#password', mocks.login.password);
        await page.type('#database', mocks.login.database);
        await page.type('#server', mocks.server);
        await page.click('#loginBtn');
    });

    // Confirm page has loaded
    it('should be loaded', async () => {
        await page.waitForSelector('html', {
            visible: true
        });      
    });
  
   // Confirm page displaying after initialized and focus is called
    it('should display root div', async () => {
        
        await page.waitForSelector('#storageApiSample', {
            visible: true
        });
        
    });

    
        
    // Navbar tests
    it('should have a navbar', async () => {
        let navbar = await page.$('#menuId') !== null;
        assert.isTrue(navbar, 'Navbar does not exist');
    });

    it('nav bar should collapse', async () => {
        await page.click('#menuToggle');
        let collapsed = await page.evaluate( () => {
            let nav = document.querySelector('#menuId');
            return nav.className.includes('menuCollapsed');
        });
        assert.isTrue(collapsed, 'Navbar does not collapse');
    });

    it('nav bar should extend from collapsed state', async () => {
        await page.click('#menuToggle');

        let extended = await page.evaluate( () => {
            let nav = document.querySelector('#menuId');
            return !nav.className.includes('menuCollapsed');
        });
        assert.isTrue(extended, 'Navbar did not re-extend');
    });
        
    it('blur button should blur addin', async () => {
        await page.click('#toggleBtn');
        let hidden = await page.evaluate( () => {
            let toggled = false;
            let addin = document.getElementById('storageApiSample');
            if(addin.className.includes('hidden')){
                toggled = true;
            }
            return toggled;
        });
        assert.isTrue(hidden, 'add-in is hidden');
    });

    it('focus button should focus addin', async () => {
        await page.click('#toggleBtn');

        let hidden = await page.evaluate( () => {
            let toggled = false;
            let addin = document.getElementById('storageApiSample');
            if(addin.className.includes('hidden')){
                toggled = true;
            }
            return toggled;
        });
        assert.isFalse(hidden, 'add-in is hidden');
    });

    // Group Search logic
    it('should open the group display box', async () => {
        await page.click('#group-toggle-button');
        await page.waitForSelector('#group-dropdown', {
            visible: true
        });

        // Cleanup.
        await page.click('#group-toggle-button');
    });

    
    it('should close the group display box', async () => {
        await page.click('#group-toggle-button');
        await page.click('#group-toggle-button');
        await page.waitForSelector('#group-dropdown', {
            visible: false
        });
    });
    
    it('should populate the group dropdown', async () => {
        await page.click('#group-toggle-button');
        await page.waitForSelector('#group-dropdown', {
            visible: true
        });
        
        let children = await page.$eval('#group-dropdown-ul', el => el.children);
        
        assert.isTrue(Object.keys(children).length === 2, 'Group dropdown is not populated.');
        
        // Cleanup.
        await page.click('#group-toggle-button');
    });
    
    it('should close the group dropdown when clicking off of the group-wrapper', async () => {
        await page.click('#group-toggle-button');
        await page.waitForSelector('#group-dropdown', {
            visible: true
        });
        await page.click('#checkmateContent');
        await page.waitForSelector('#group-dropdown', {
            visible: false
        });

        let dropdownDisplay = await page.$eval('#group-dropdown', el => el.style.display);

        assert.isTrue(dropdownDisplay === 'none', 'Dropdown display value is ' + dropdownDisplay);
        
        await page.click('#group-toggle-button');
    });

    it('should filter the group dropdown', async () => {
        let enterKey = 'Enter';

        await page.click('#group-toggle-button');
        await page.type('#group-input', 'child');
        await page.keyboard.press(enterKey);
        
        let children = await page.$eval('#group-dropdown-ul', el => el.children);
        
        // Check to make sure the entire dictionary is searched, not just the root node.
        assert.isTrue(Object.keys(children).length === 3, 'Search did not return all related groups');

        // Cleanup.
        await page.click('#group-toggle-button');
    });

    // Should notify when not working?
    it('should store active groups in the state', async () => {
        let enterKey = 'Enter';

        await page.click('#group-toggle-button');
        await page.type('#group-input', 'child');
        await page.keyboard.press(enterKey);
        await page.waitForSelector('#group-dropdown-ul', {
            visible: true
        });
        await page.click('#group-use-b4-label');

        let activeGroups = await page.evaluate( async () => {
            return state.getGroupFilter();
        });

        assert.isTrue(activeGroups.length === 1);
        assert.isTrue(activeGroups[0].id === 'b4');

        // Cleanup.
        await page.click('#group-toggle-button');
    });

    it('should refocus after group filter is selected', async () => {
        let originalFocus = await page.evaluate( () => geotab.addin.storageApiSample.focus);

        await page.click('#group-toggle-button');
        await page.evaluate( () => {
            geotab.addin.storageApiSample.count = 0;
            geotab.addin.storageApiSample.focus = () => { geotab.addin.storageApiSample.count++; };
        });
        await page.click('#group-use-b4-label');

        let invocations = await page.evaluate( () => {
            return geotab.addin.storageApiSample.count;
        });

        assert.isTrue(invocations === 1, 'Incorrect number of invocations on focus().');

        // Undoing state modifications for future tests.
        await page.evaluate( (addinFocus) => {
            geotab.addin.storageApiSample.focus = addinFocus;
        }, originalFocus);
    });
        
    
    // Mock function tests
    it('should authenticate api', async () => {
        let success = await page.evaluate( () => {
            let authenticated = false;
            api.getSession( (credentials, server) => {
                if(server !== 'undefined' && credentials !== 'undefined'){
                    authenticated = true;
                }
            });
            return authenticated;
        });
        assert.isTrue(success, 'api is not authenticating properly');
    })

    it('add-in should exist in geotab object', async () => {
        let keyLength = await page.evaluate( () => {
            
            let len = Object.keys(geotab.addin).length
            
            return len;
        });
        assert.isTrue(keyLength > 0, `Add-in is not present in mock backend`);
    });  

    it('should load the state object', async () => {
        let state = await page.evaluate( () => {
            let stateExists = typeof state == 'object';
            return stateExists;
        });
        assert.isTrue(state, 'State is not defined');
    });

    // Tests Finished
    after(async () => {
        await browser.close();
    });

    
});
