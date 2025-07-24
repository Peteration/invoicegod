const http = require('http');
const countries = require('./countries/supported');
const apiUrl = 'http://jsonvat.com/';

/**
 * A tiny utility for getting EU Vat rates.
 */
class EuroVat {
  /**
   * A request to retrieve vat rates io
   * @param {String} countryCode {Optional} An EU country whose
   * vat would like to retrieved using the country code.
   * @return {Promise} Returns a promise
   */
  getRates(countryCode = null) {
    if (countryCode === null) {
      return this._makeRequest(apiUrl);
    } else {
      if (typeof countryCode === 'string') {
        if (countries.supported.includes(countryCode)) {
          return this._findCountryVat(countryCode);
        } else {
          throw new Error(
            `Invalid countryCode: ${countryCode} is not supported`
          );
        }
      } else {
        throw new TypeError('Country code must be a string value');
      }
    }
  }

  async _findCountryVat(countryCode) {
    const rates = await this._makeRequest(apiUrl);
    let countryRates = rates.filter(
      rate => rate.country_code === countryCode
    )[0];
    return this._formatClientResponse(countryRates);
  }

  _formatClientResponse(countryRates) {
    countryRates.periods = countryRates.periods[0];
    countryRates.countryCode = countryRates.country_code;
    delete countryRates.code && countryRates.country_code;
    return countryRates;
  }

  _makeRequest(apiUrl) {
    return new Promise((resolve, reject) => {
      http
        .get(apiUrl, res => {
          let buffer = '';
          res.on('data', chunk => {
            buffer += chunk;
          });

          res.on('end', () => {
            return resolve(JSON.parse(buffer).rates);
          });
        })
        .on('error', err => {
          return reject({ error: err.message });
        });
    });
  }
}

module.exports = EuroVat;
