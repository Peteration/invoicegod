import axios from 'axios';
import NodeCache from 'node-cache';

const currencyCache = new NodeCache({ stdTTL: 3600 }); // 1 hour caching

const EXCHANGE_API = 'https://api.exchangerate.host/latest';
const CRYPTO_API = 'https://api.coingecko.com/api/v3/simple/price';

export async function fetchExchangeRates(
  baseCurrency: string = 'USD',
  targetCurrency?: string
): Promise<Record<string, number>> {
  const cacheKey = `rates_${baseCurrency}`;
  const cached = currencyCache.get(cacheKey);
  
  if (cached) {
    return targetCurrency 
      ? { [targetCurrency]: (cached as Record<string, number>)[targetCurrency] } 
      : cached as Record<string, number>;
  }

  try {
    const response = await axios.get(EXCHANGE_API, {
      params: {
        base: baseCurrency,
        symbols: targetCurrency || undefined
      },
      timeout: 5000
    });

    const rates = response.data.rates;
    currencyCache.set(cacheKey, rates);
    return targetCurrency ? { [targetCurrency]: rates[targetCurrency] } : rates;
  } catch (error) {
    console.error('Exchange API failed, using fallback rates');
    return getFallbackRates(baseCurrency, targetCurrency);
  }
}

export async function convertCryptoToFiat(
  amount: number,
  crypto: string,
  fiat: string = 'USD'
): Promise<number> {
  const cacheKey = `crypto_${crypto}_${fiat}`;
  const cached = currencyCache.get(cacheKey);
  
  if (cached) return amount * (cached as number);

  try {
    const response = await axios.get(CRYPTO_API, {
      params: {
        ids: crypto,
        vs_currencies: fiat
      },
      timeout: 5000
    });

    const rate = response.data[crypto.toLowerCase()][fiat.toLowerCase()];
    currencyCache.set(cacheKey, rate);
    return amount * rate;
  } catch (error) {
    console.error('Crypto conversion failed, using fallback');
    return amount * getCryptoFallbackRate(crypto, fiat);
  }
}

function getFallbackRates(base: string, target?: string): Record<string, number> {
  const fallbackRates = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    JPY: 144.17,
    CAD: 1.34,
    AUD: 1.49,
    CHF: 0.89,
    CNY: 7.24,
    INR: 82.97,
    MXN: 17.07,
    BRL: 4.92,
    // ... other currencies
  };

  if (!target) return fallbackRates;

  if (base !== 'USD') {
    const baseRate = fallbackRates[base] || 1;
    return { [target]: (fallbackRates[target] || 1) / baseRate };
  }

  return { [target]: fallbackRates[target] || 1 };
}

function getCryptoFallbackRate(crypto: string, fiat: string): number {
  const cryptoRates = {
    btc: { usd: 61800, eur: 57400 },
    eth: { usd: 3400, eur: 3160 },
    usdc: { usd: 1, eur: 0.93 },
    sol: { usd: 140, eur: 130 },
    // ... other cryptocurrencies
  };

  return cryptoRates[crypto.toLowerCase()]?.[fiat.toLowerCase()] || 0;
}