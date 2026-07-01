/**
 * Módulo de integración con XRP Ledger (Testnet).
 * Proporciona métodos para registrar y verificar llaveros mosaico on-chain
 * mediante el estándar XLS-20 (NFTs).
 */

const TESTNET_NODE = "wss://s.altnet.rippletest.net:51233";
const NFT_TAXON_MOSAICO = 1001; // Taxón oficial reservado para identidades Mosaico Criptográfico

let clientInstance = null;

/**
 * Obtener o inicializar la instancia conectada del cliente de XRPL.
 */
export async function getXrplClient(logger = console.log) {
  if (typeof window.xrpl === 'undefined') {
    throw new Error("El SDK de XRPL no se ha cargado correctamente en la ventana.");
  }

  if (clientInstance && clientInstance.isConnected()) {
    return clientInstance;
  }

  logger("[red] Conectando con nodo Testnet...");
  clientInstance = new window.xrpl.Client(TESTNET_NODE);

  await clientInstance.connect();
  logger("[red] ¡Conexión establecida con XRPL Testnet!");
  return clientInstance;
}

/**
 * Desconectar la conexión activa de XRPL si existe.
 */
export async function disconnectXrpl() {
  if (clientInstance && clientInstance.isConnected()) {
    await clientInstance.disconnect();
    clientInstance = null;
  }
}

/**
 * Genera y fondea una nueva cuenta (billetera) de prueba usando el Faucet oficial de XRPL Testnet.
 */
export async function generateFaucetWallet(logger = console.log) {
  const client = await getXrplClient(logger);
  logger("[red] Solicitando fondos del Faucet de XRPL Testnet...");
  
  // fundWallet genera y fondea automáticamente con ~400 XRP en Testnet
  const { wallet, balance } = await client.fundWallet();
  
  logger(`[red] ¡Cuenta creada! Dirección: ${wallet.address}`);
  logger(`[red] Saldo inicial: ${balance} XRP`);
  return {
    address: wallet.address,
    seed: wallet.seed,
    wallet
  };
}

/**
 * Acuña (mints) un Soulbound NFT (no transferible) XLS-20 en la blockchain de XRPL.
 * Esto valida la dirección como poseedora de su propio llavero mosaico oficial.
 */
export async function registerMnemonicNft(seed, logger = console.log) {
  const client = await getXrplClient(logger);
  const wallet = window.xrpl.Wallet.fromSeed(seed);
  
  logger(`[red] Preparando registro para: ${wallet.address}`);
  logger("[red] Creando transacción NFTokenMint...");

  // Configuración del NFT:
  // - NFTokenTaxon: 1001 (identificador único para Mosaico Criptográfico)
  // - Flags: 0 (Por defecto, al NO marcar tfTransferable = 8, el NFT es Soulbound/No transferible)
  // - URI: Se genera una URI que codifica el estándar
  const uriHex = window.xrpl.convertStringToHex(`mosaico://identity/${wallet.address}`);

  const txJson = {
    TransactionType: "NFTokenMint",
    Account: wallet.address,
    NFTokenTaxon: NFT_TAXON_MOSAICO,
    Flags: 0,
    URI: uriHex
  };

  logger("[red] Enviando transacción al ledger y esperando validación...");
  const response = await client.submitAndWait(txJson, { wallet });
  
  if (response.result.meta.TransactionResult === "tesSUCCESS") {
    logger(`[red] ¡Llavero registrado con éxito! Hash de Tx: ${response.result.hash}`);
    return {
      success: true,
      hash: response.result.hash
    };
  } else {
    throw new Error(`Error en el ledger: ${response.result.meta.TransactionResult}`);
  }
}

/**
 * Consulta la blockchain de XRPL para verificar si una clave pública posee su llavero registrado.
 * Un llavero es válido si la cuenta posee un NFT acuñado por ella misma con Taxon 1001.
 */
export async function checkAddressRegistration(address, logger = console.log) {
  try {
    // Validar formato de dirección XRPL de forma segura
    if (!window.xrpl) {
      return false;
    }
    const isValid = (typeof window.xrpl.isValidAddress === 'function') 
      ? window.xrpl.isValidAddress(address)
      : /^r[1-9A-HJ-NP-Za-km-z]{25,35}$/.test(address);

    if (!isValid) {
      return false;
    }

    const client = await getXrplClient(() => {}); // Consulta silenciosa
    
    const response = await client.request({
      command: "account_nfts",
      account: address,
      ledger_index: "validated"
    });

    const nfts = response.result.account_nfts || [];
    
    // Buscar un NFT con taxon 1001 emitido por la misma cuenta (autenticidad autónoma)
    const hasMosaicoNft = nfts.some(nft => {
      return nft.NFTokenTaxon === NFT_TAXON_MOSAICO && nft.Issuer === address;
    });

    return hasMosaicoNft;
  } catch (error) {
    logger(`[error-silent] Error de verificación XRPL para ${address}: ${error.message}`);
    return false;
  }
}
