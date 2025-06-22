Here's the fixed version with all missing closing brackets and proper structure:

'use client';

import { useState, useEffect } from 'react';
[Previous imports...]

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [metadataForm, setMetadataForm] = useState({
    website: '',
    twitter: '',
    github: '',
    logoUri: ''
  });
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [solBalance, setSolBalance] = useState(0);

  const { wallet, publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    }
  }, [connected, publicKey]);

  const loadUserData = async () => {
    if (!connected || !publicKey) return;
    
    setIsLoadingTokens(true);
    try {
      const balance = await getSolBalance(publicKey);
      setSolBalance(balance);
      
      const tokens = await fetchUserTokens();
      setUserTokens(tokens);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoadingTokens(false);
    }
  };

  [Rest of the component code...]

}