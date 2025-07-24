export function generateCryptoURI(
  currency: string,
  address: string,
  amount?: number,
  memo?: string,
  network: string = 'mainnet'
): string {
  const uriSchemes = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    LTC: 'litecoin',
    DOGE: 'dogecoin'
  };

  const scheme = uriSchemes[currency] || currency.toLowerCase();
  let uri = `${scheme}:${address}`;

  // Add amount if specified
  if (amount !== undefined && amount > 0) {
    uri += `?amount=${amount}`;
    
    // Add memo/note if specified
    if (memo) {
      uri += currency === 'BTC' 
        ? `&label=${encodeURIComponent(memo)}` 
        : `&memo=${encodeURIComponent(memo)}`;
    }
  } else if (memo) {
    uri += `?memo=${encodeURIComponent(memo)}`;
  }

  // Add network parameter for testnet
  if (network !== 'mainnet') {
    uri += (uri.includes('?') ? '&' : '?') + `network=${network}`;
  }

  return uri;
}