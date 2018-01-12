const Browser = require('zombie');
const nock = require('nock');
const assert = require('chai').assert;
const rison = require('rison');

describe('User visits addin', function () {

  const browser = new Browser();

  // to enable zombie debugging, uncomment this line
  // browser.debug();

  const host = 'http://localhost:9000/';
  const vehicleId = '(id:b1)';

  // open page
  before(done => {
    return browser.visit(host, done);
  });

  it('should be loaded', function () {
    browser.assert.success();
  });

  describe('Show addin content after initialized and focus is called', function () {
    it('should display root div', () => {
      browser.assert.style('#engineDataButton', 'display', '');
    });

    it('should display message when no vehicle selected ', () => {
      browser.pressButton('.customButton');
      browser.assert.element('#engineDataButton-addin', '');
    });

    it('should redirect to engine data profile page ', (done) => {
      browser.visit(`${host}#${vehicleId}`, () => {
        browser.pressButton('.customButton', () => {
          browser.assert.url(url => {

            assert.isTrue(url.indexOf('geotab/checkmate/ui/engineDataProfile.html') > -1);
            
            let hash = decodeURI(url.split('#')[1]);
            let hashValues = rison.decode(hash);
            
            assert.isNotNull(hashValues.dateRange);
            assert.isNotNull(hashValues.dateRange.startDate);
            assert.isNotNull(hashValues.dateRange.endDate);
            assert.equal('b1', hashValues.device);
            assert.deepEqual(['DiagnosticEngineSpeedId','DiagnosticGoDeviceVoltageId','DiagnosticDeviceTotalFuelId'], hashValues.diagnostic);

            done();
          });
        });
      });
    });
  });

});
