import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['style', 'script', 'iframe'],
    FORBID_ATTR: ['style', 'onerror']
  });
}

export function validateCryptoAddress(address: string, chain: string): boolean {
  const chains: Record<string, RegExp> = {
    ETH: /^0x[a-fA-F0-9]{40}$/,
    SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/
  };
  return chains[chain]?.test(address) || false;
}

export function createSecureApiClient(token: string) {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Security-Policy': 'require-trusted-types-for \'script\''
    },
    maxRedirects: 0,
    timeout: 10000,
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
  });
}