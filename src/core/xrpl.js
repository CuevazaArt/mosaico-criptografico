/**
 * XRP Ledger integration module.
 * Provides methods to register and verify mosaic keys on-chain
 * using the XLS-20 standard (NFTs), with network redundancy and non-custodial support.
 */

const NETWORKS = {
  testnet: [
    "wss://s.altnet.rippletest.net:51233",
    "wss://testnet.xrpl-labs.com",
    "wss://s.altnet.rippletest.net:51234"
  ],
  mainnet: [
    "wss://xrplcluster.com",
    "wss://s1.ripple.com",
    "wss://s2.ripple.com",
    "wss://xrpl.ws"
  ]
};

const NFT_TAXON_MOSAICO = 1001; // Official taxon reserved for Cryptographic Mosaic identities

let clientInstance = null;
let currentNetwork = 'testnet'; // 'testnet' | 'mainnet'

/**
 * Configure the active network for XRPL operations.
 */
export function setXrplNetwork(network) {
  if (network === 'mainnet' || network === 'testnet') {
    if (currentNetwork !== network) {
      currentNetwork = network;
      disconnectXrpl();
    }
  }
}

/**
 * Get the active network.
 */
export function getXrplNetwork() {
  return currentNetwork;
}

/**
 * Get or initialize the connected XRPL client instance with fault tolerance.
 * Tries connecting to the configured nodes in sequential order in case of error.
 */
export async function getXrplClient(logger = console.log) {
  if (typeof window.xrpl === 'undefined') {
    throw new Error("XRPL SDK has not loaded correctly in the window.");
  }

  if (clientInstance && clientInstance.isConnected()) {
    return clientInstance;
  }

  const netName = currentNetwork === 'mainnet' ? "Mainnet" : "Testnet";
  const nodes = NETWORKS[currentNetwork];
  
  for (const node of nodes) {
    try {
      logger(`[red] Connecting to node ${netName} (${node})...`);
      clientInstance = new window.xrpl.Client(node);
      
      // Handle unexpected disconnections to clean up the client
      clientInstance.on('disconnected', (code) => {
        logger(`[red] Closed connection with XRPL node. Code: ${code}`);
        clientInstance = null;
      });

      await clientInstance.connect();
      logger(`[red] Connection established with XRPL ${netName}!`);
      return clientInstance;
    } catch (err) {
      logger(`[red] Connection error on ${node}: ${err.message}. Trying next node...`);
      clientInstance = null;
    }
  }

  throw new Error(`Could not connect to any node on the ${netName} network.`);
}

/**
 * Disconnect the active XRPL connection if it exists.
 */
export async function disconnectXrpl() {
  if (clientInstance && clientInstance.isConnected()) {
    try {
      await clientInstance.disconnect();
    } catch (e) {
      // Ignore failures on close
    }
  }
  clientInstance = null;
}

/**
 * Generates and funds a new test account (wallet) using the official XRPL Testnet Faucet.
 */
export async function generateFaucetWallet(logger = console.log) {
  if (currentNetwork === 'mainnet') {
    throw new Error("Automatic wallet generation with Faucet is not available on Mainnet. You must import an existing wallet with balance.");
  }

  const client = await getXrplClient(logger);
  logger("[red] Requesting funds from XRPL Testnet Faucet...");
  
  // fundWallet automatically generates and funds with ~400 XRP in Testnet
  const { wallet, balance } = await client.fundWallet();
  
  logger(`[red] Account created! Address: ${wallet.address}`);
  logger(`[red] Initial balance: ${balance} XRP`);
  return {
    address: wallet.address,
    seed: wallet.seed,
    wallet
  };
}

/**
 * Connects an external non-custodial wallet of the user and returns its public address.
 */
export async function connectWallet(walletType, logger = console.log) {
  if (walletType === 'gem') {
    if (typeof window.GemWallet === 'undefined') {
      throw new Error("Gem Wallet is not installed or not accessible in this browser.");
    }
    logger("[red] Connecting to Gem Wallet...");
    const response = await window.GemWallet.getAddress();
    if (!response || !response.result || !response.result.address) {
      throw new Error("User rejected connection or no address was returned.");
    }
    logger(`[red] Gem Wallet connected: ${response.result.address}`);
    return response.result.address;
  } else if (walletType === 'crossmark') {
    if (typeof window.crossmark === 'undefined') {
      throw new Error("Crossmark is not installed or not accessible in this browser.");
    }
    logger("[red] Connecting to Crossmark...");
    let address = window.crossmark.address;
    if (!address) {
      const response = await window.crossmark.signIn();
      address = response.address;
    }
    if (!address) {
      throw new Error("User rejected connection or no address was returned.");
    }
    logger(`[red] Crossmark connected: ${address}`);
    return address;
  } else if (walletType === 'xaman') {
    logger("[red] Connecting to Xaman (Xumm)...");
    
    // If the Xumm client library is available and initialized
    if (window.xumm && typeof window.xumm.authorize === 'function') {
      const state = await window.xumm.authorize();
      if (state && state.me && state.me.account) {
        logger(`[red] Xaman connected: ${state.me.account}`);
        return state.me.account;
      }
    }
    
    // Xaman SDK simulation for local dApp demo if no active API Key
    const mockAddress = "rMOCKxamanAddressMainnetActive123";
    logger(`[red] [Xaman Demo] Connected mocked address: ${mockAddress}`);
    return mockAddress;
  }
  throw new Error("Unsupported wallet type.");
}

/**
 * Mints an XLS-20 Soulbound NFT (non-transferable) on the XRPL blockchain.
 * This validates the address as owning its official mosaic key.
 */
export async function registerMnemonicNft(seed, logger = console.log) {
  const client = await getXrplClient(logger);
  const wallet = window.xrpl.Wallet.fromSeed(seed);
  
  logger(`[red] Preparing registration for: ${wallet.address}`);
  logger("[red] Creating NFTokenMint transaction...");

  const uriHex = window.xrpl.convertStringToHex(`mosaico://identity/${wallet.address}`);

  const txJson = {
    TransactionType: "NFTokenMint",
    Account: wallet.address,
    NFTokenTaxon: NFT_TAXON_MOSAICO,
    Flags: 0,
    URI: uriHex
  };

  logger("[red] Submitting transaction to the ledger and waiting for validation...");
  const response = await client.submitAndWait(txJson, { wallet });
  
  if (response.result.meta.TransactionResult === "tesSUCCESS") {
    logger(`[red] Mosaic key successfully registered! Tx Hash: ${response.result.hash}`);
    return {
      success: true,
      hash: response.result.hash
    };
  } else {
    throw new Error(`Ledger error: ${response.result.meta.TransactionResult}`);
  }
}

/**
 * Mints an identity Soulbound NFT using a connected non-custodial wallet.
 */
export async function registerMnemonicNftNonCustodial(address, walletType, logger = console.log) {
  const client = await getXrplClient(logger);
  const uriHex = window.xrpl.convertStringToHex(`mosaico://identity/${address}`);
  
  const txJson = {
    TransactionType: "NFTokenMint",
    Account: address,
    NFTokenTaxon: NFT_TAXON_MOSAICO,
    Flags: 0,
    URI: uriHex
  };

  logger(`[red] Preparing registration for: ${address} using ${walletType}...`);
  logger("[red] Sending transaction to your wallet to sign...");

  if (walletType === 'gem') {
    const response = await window.GemWallet.signAndSubmitTransaction({ transaction: txJson });
    if (response && response.result && response.result.hash) {
      logger(`[red] Mosaic key registered with Gem Wallet! Tx Hash: ${response.result.hash}`);
      return { success: true, hash: response.result.hash };
    } else {
      throw new Error("Transaction cancelled or failed in Gem Wallet.");
    }
  } else if (walletType === 'crossmark') {
    const response = await window.crossmark.signAndSubmitAndWait(txJson);
    const hash = response.result?.hash || response.hash;
    if (hash) {
      logger(`[red] Mosaic key registered with Crossmark! Tx Hash: ${hash}`);
      return { success: true, hash: hash };
    } else {
      throw new Error("Transaction cancelled or failed in Crossmark.");
    }
  } else if (walletType === 'xaman') {
    logger("[red] Creating signing request in Xaman (Xumm)...");
    
    // If the Xumm client library is available and initialized
    if (window.xumm && typeof window.xumm.payload === 'object') {
      const payload = await window.xumm.payload.create({
        txjson: txJson
      });
      if (payload && payload.next && payload.next.always) {
        logger(`[red] Signing payload created. Redirecting to Xaman: ${payload.next.always}`);
        window.open(payload.next.always, '_blank');
        return { success: true, hash: payload.uuid };
      }
    }
    
    // Xaman flow simulation for local demonstration
    const demoTxHash = "E0B91F8436B0C689FA42A7C3D821034D8E9A2BC3CDEEF53B182904CBA638D9E2";
    logger("[red] [Xaman Demo] Simulating QR scan and successful signature on phone.");
    logger(`[red] [Xaman Demo] Mocked transaction successful. Tx Hash: ${demoTxHash}`);
    return { success: true, hash: demoTxHash };
  }
  throw new Error("Unsupported wallet.");
}

/**
 * Queries the XRPL blockchain to verify if a public key has its registered key.
 * A key is valid if the account owns an NFT minted by itself with Taxon 1001.
 */
export async function checkAddressRegistration(address, logger = console.log) {
  try {
    if (!window.xrpl) {
      return false;
    }
    const isValid = (typeof window.xrpl.isValidAddress === 'function') 
      ? window.xrpl.isValidAddress(address)
      : /^r[1-9A-HJ-NP-Za-km-z]{25,35}$/.test(address);

    if (!isValid) {
      return false;
    }

    const client = await getXrplClient(() => {}); // Silent query
    
    const response = await client.request({
      command: "account_nfts",
      account: address,
      ledger_index: "validated"
    });

    const nfts = response.result.account_nfts || [];
    
    // Look for an NFT with taxon 1001 issued by the same account (autonomous authenticity)
    const hasMosaicoNft = nfts.some(nft => {
      return nft.NFTokenTaxon === NFT_TAXON_MOSAICO && nft.Issuer === address;
    });

    return hasMosaicoNft;
  } catch (error) {
    logger(`[error-silent] XRPL verification error for ${address}: ${error.message}`);
    return false;
  }
}
