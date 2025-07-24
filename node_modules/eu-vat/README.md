# eu-vat

[![Build Status](https://travis-ci.org/kenigbolo/eu-vat.svg?branch=master)](https://travis-ci.org/kenigbolo/eu-vat)

## Description
This `eu-vat` module is a tiny package the helps retrieve vat rates for EU countries. It makes use of the [json-vat](https://jsonvat.com) api to retrieve the most recent vat rates for EU countries. This library can be easily plugged into your ecommerce platforms if you need to calculate cost related to vat e.g. shiiping cost etc.

# Developers Guide

## Dependencies

* NPM 6.x
* Node 8.x

## NPM

This package has been published on [NPM](https://www.npmjs.com/package/eu-vat) and is freely available according to the MIT license. To install via npm simply run `npm install eu-vat`.

## NPM Package Usage
```javascript

const EuroVat = require('eu-vat');
const vat = new EuroVat();


vat.getRates('FI').then((rates) => {
  console.log(rates);
  // Do something with rates
});

/* Alternative style using async await */
const getRates = async () => {
  const rates = await vat.getRates('RO');
  console.log(rates);
  // Do something with rates
}
```
The utility returns a resolved or rejected promise.

### Available function

This module exposes one primary functions `getRates`. The `getRates` function accepts just one argument `countryCode`. The get rate function returns a promise.

`Accepted method argument`

The `countryCode {Optional}` - This refers to the ISO2 country code of the European country whose tax rate is to be retrieved. This argument is optional i.e if no countryCode is passed, the function will return a list countaining objects of each countries tax rates. This argument compulsorily has to be a string if passed of course :). Kindly see the next section for a list of supported countries.

`Returned Value`

The returned value largely depends on if a countryCode is passed, however the returned value is always a Promise, although using the async/await syntax one could easily mimick real time data handling. For a `getRates` request with a countryCode passed, say Romanian countryCode `RO`, the following should be an expected response.

```javascript
{ 
  name: 'Romania',
  countryCode: 'RO',
  periods:
  { effective_from: '2017-01-01',
    rates: { 
      reduced1: 5, reduced2: 9, standard: 19 
    }
  } 
}
```


# Supported Countries
```
name: 'Spain', countryCode: 'ES'

name: 'Bulgaria', countryCode: 'BG'

name: 'Hungary', countryCode: 'HU'

name: 'Latvia', countryCode: 'LV'

name: 'Poland', countryCode: 'PL'

name: 'United Kingdom', countryCode: 'GB'

name: 'Czech Republic', countryCode: 'CZ'

name: 'Malta', countryCode: 'MT'

name: 'Italy', countryCode: 'IT'

name: 'Slovenia', countryCode: 'SI'

name: 'Ireland', countryCode: 'IE'

name: 'Sweden', countryCode: 'SE'

name: 'Denmark', countryCode: 'DK'

name: 'Finland', countryCode: 'FI'

name: 'Cyprus', countryCode: 'CY'

name: 'Luxembourg', countryCode: 'LU'

name: 'Romania', countryCode: 'RO'

name: 'Estonia', countryCode: 'EE'

name: 'Greece', countryCode: 'GR'

name: 'Lithuania', countryCode: 'LT'

name: 'France', countryCode: 'FR'

name: 'Croatia', countryCode: 'HR'

name: 'Belgium', countryCode: 'BE'

name: 'Netherlands', countryCode: 'NL'

name: 'Slovakia', countryCode: 'SK'

name: 'Germany', countryCode: 'DE'

name: 'Portugal', countryCode: 'PT'

name: 'Austria', countryCode: 'AT'
```
