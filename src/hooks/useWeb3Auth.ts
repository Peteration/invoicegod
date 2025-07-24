import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { AuditLogger } from '../core/audit/auditLogger';

const audit = AuditLogger.getInstance();

export function useWeb3Auth() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    setIsAuthenticating(true);
    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      
      setAccount(accounts[0]);
      setProvider(web3Provider);

      await audit.logEvent({
        eventType: 'WALLET_CONNECTED',
        metadata: { address: accounts[0] }
      });
    } catch (error) {
      await audit.logSecurityEvent('WALLET_CONNECTION_FAILED', {
        error: error.message
      });
      console.error('Error connecting wallet:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signMessage = async (message: string) => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      await audit.logEvent({
        eventType: 'MESSAGE_SIGNED',
        userId: account,
        metadata: { message }
      });

      return signature;
    } catch (error) {
      await audit.logSecurityEvent('SIGNATURE_FAILED', {
        error: error.message,
        account
      });
      throw error;
    }
  };

  const authenticate = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    setIsAuthenticating(true);
    try {
      // Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account })
      });
      
      const { nonce } = await nonceRes.json();
      const signature = await signMessage(`InvoiceGod Authentication: ${nonce}`);

      // Verify with backend
      const authRes = await fetch('/api/auth/web3-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account, signature, nonce })
      });

      const { token, user } = await authRes.json();
      
      if (token) {
        localStorage.setItem('web3_token', token);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    const checkConnectedWallet = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setProvider(provider);
        }
      }
    };

    checkConnectedWallet();

    window.ethereum?.on('accountsChanged', (accounts: string[]) => {
      setAccount(accounts[0] || null);
    });
  }, []);

  return {
    account,
    provider,
    isAuthenticating,
    connectWallet,
    signMessage,
    authenticate
  };
}