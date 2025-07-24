process.env.NODE_ENV = 'test';

const chai = require('chai');
const expect = chai.expect;
const EUVAT = require('../index');

/*
* Test the ue vat utility module's functionality
*/
describe('Testing eu vat utility module', () => {
  const vat = new EUVAT();
  it('it should throw an error if countryCode is not a string', done => {
    const invalidCountryCode = () => {
      vat.getRates(88);
    };
    expect(invalidCountryCode).to.throw(
      TypeError,
      'Country code must be a string value'
    );
    done();
  });

  it('it should throw an error if countryCode is not supported', done => {
    const unsupportedCountryCode = () => {
      vat.getRates('GF');
    };
    expect(unsupportedCountryCode).to.throw(
      Error,
      'Invalid countryCode: GF is not supported'
    );
    done();
  });

  it('it should have a name key in json response if request is successful', done => {
    (async () => {
      const rate = await vat.getRates('FI');
      expect(rate).to.have.property('name');
      done();
    })();
  });

  it('it should have a countryCode key in json response if request is successful', done => {
    (async () => {
      const rate = await vat.getRates('FI');
      expect(rate).to.have.property('countryCode');
      done();
    })();
  });

  it('it should have a periods key in json response if request is successful', done => {
    (async () => {
      const rate = await vat.getRates('FI');
      expect(rate).to.have.property('periods');
      done();
    })();
  });

  it('it should have a rates key inside periods in json response if request is successful', done => {
    (async () => {
      const rate = await vat.getRates('FI');
      expect(rate.periods).to.have.property('rates');
      done();
    })();
  });
  it('it should have a standard key inside rates in json response if request is successful', done => {
    (async () => {
      const rate = await vat.getRates('FI');
      expect(rate.periods.rates).to.have.property('standard');
      done();
    })();
  });
});
