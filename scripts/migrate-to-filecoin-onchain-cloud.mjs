/**
 * migrate-to-filecoin-onchain-cloud.mjs
 *
 * Migrates TrustCoat ERC-1155 metadata from Lighthouse (IPFS pinning)
 * to Filecoin Onchain Cloud using the official @filoz/synapse-sdk.
 *
 * Filecoin Onchain Cloud = verifiable storage with on-chain proofs via PDP
 * (Proof of Data Possession) — not just IPFS pinning.
 *
 * Usage:
 *   # Dry run — show what would be uploaded
 *   DRY_RUN=true node scripts/migrate-to-filecoin-onchain-cloud.mjs
 *
 *   # Calibration testnet (needs test FIL + USDFC)
 *   LOCUS_OWNER_PRIVATE_KEY=0x... FILECOIN_NETWORK=calibration node scripts/migrate-to-filecoin-onchain-cloud.mjs
 *
 *   # Mainnet (needs real FIL + USDFC)
 *   LOCUS_OWNER_PRIVATE_KEY=0x... FILECOIN_NETWORK=mainnet node scripts/migrate-to-filecoin-onchain-cloud.mjs
 *
 * Prerequisites:
 *   - FIL for gas (calibration faucet: https://faucet.calibration.fildev.network/)
 *   - USDFC for storage payment (wrapped via https://filfox.info/en/wrap)
 *   - Both at address 0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7
 */

import { Synapse } from '@filoz/synapse-sdk'
import { getChain } from '@filoz/synapse-core/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'
import https from 'https'
import http2 from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Config ──────────────────────────────────────────────────────────────────

const PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
const NETWORK = process.env.FILECOIN_NETWORK || 'calibration'
const DRY_RUN = process.env.DRY_RUN === 'true'
const CHAIN_ID = NETWORK === 'mainnet' ? 314 : 314159

const TRUST_COAT_ADDRESS = process.env.TRUST_COAT_ADDRESS || '0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e'

// Current Lighthouse URIs from the TrustCoat contract (ipfs:// format)
const CURRENT_TIER_IPFS_CIDS = {
  0: 'bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y',
  1: 'bafkreieif7573erx6nwlpuiljejlzoodrqxayubdo7h4lwwfsx5iogvvuu',
  2: 'bafkreiepuzrl7x5wjvkwx6psrg4eiux47vpjfjvjqtsr4shlfo6huc7wwa',
  3: 'bafkreibzsr2svupoadcgzhhewu6j3f22drlpaphn6stmiu23d2w6x4ve6y',
  4: 'bafkreihcf6fjgvvu7qsqp6k5cfm7oj7fpxs6drdzuvjjsrlhzq7rxiphwy',
  5: 'bafkreieo5gvchbxmcrhlhrxlhvik4ohfc64hajj7rjspgjazomylsoari4',
}

const LIGHTHOUSE_GATEWAY = 'https://gateway.lighthouse.storage/ipfs'

// TrustCoat ABI — only what we need
const TRUST_COAT_ABI = parseAbi([
  'function setURI(uint256 tier, string calldata newURI) external',
  'function uri(uint256 tier) external view returns (string memory)',
  'function owner() external view returns (address)',
])

// ─── HTTP fetch helper ────────────────────────────────────────────────────────

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http2
    lib.get(url, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' NULL TrustCoat → Filecoin Onchain Cloud Migration')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`Network:   Filecoin ${NETWORK} (chainId ${CHAIN_ID})`)
  console.log(`Mode:      ${DRY_RUN ? 'DRY RUN (no transactions)' : 'LIVE'}`)
  console.log(`Contract:  ${TRUST_COAT_ADDRESS} (Base Mainnet)`)
  console.log()

  if (!PRIVATE_KEY) {
    console.error('ERROR: LOCUS_OWNER_PRIVATE_KEY is not set.')
    console.error('       Set it in .env or pass as env var.')
    process.exit(1)
  }

  // Validate private key format
  const pk = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`

  const account = privateKeyToAccount(pk)
  console.log(`Deployer:  ${account.address}`)
  console.log()

  // ─── Step 1: Check FIL balance (required for gas) ───────────────────────────

  if (!DRY_RUN) {
    const rpcUrl = NETWORK === 'mainnet'
      ? 'https://api.node.glif.io/rpc/v1'
      : 'https://api.calibration.node.glif.io/rpc/v1'

    console.log('[1/4] Checking Filecoin balance...')
    const balBuf = await fetchBuffer(rpcUrl)
      .catch(() => null)

    // Use RPC directly
    const balResult = await new Promise((resolve) => {
      const body = JSON.stringify({
        jsonrpc: '2.0', method: 'eth_getBalance',
        params: [account.address, 'latest'], id: 1
      })
      const urlObj = new URL(rpcUrl)
      const req = https.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
      }, (res) => {
        let d = ''
        res.on('data', c => d += c)
        res.on('end', () => resolve(JSON.parse(d)))
      })
      req.on('error', () => resolve({ result: '0x0' }))
      req.write(body)
      req.end()
    })

    const filBalance = BigInt(balResult.result || '0x0')
    const filBalanceEth = Number(filBalance) / 1e18
    console.log(`    FIL balance: ${filBalanceEth.toFixed(6)} FIL`)

    if (filBalance === 0n) {
      console.error()
      console.error('ERROR: No FIL available for gas on Filecoin', NETWORK)
      console.error()
      if (NETWORK === 'calibration') {
        console.error('Get test FIL:')
        console.error('  https://faucet.calibration.fildev.network/')
        console.error('  Address:', account.address)
      } else {
        console.error('Acquire mainnet FIL:')
        console.error('  Bridge ETH → FIL via https://www.coinbase.com/')
        console.error('  Or buy FIL on any CEX and withdraw to:', account.address)
      }
      console.error()
      console.error('Then re-run: FILECOIN_NETWORK=' + NETWORK + ' node scripts/migrate-to-filecoin-onchain-cloud.mjs')
      process.exit(1)
    }
  }

  // ─── Step 2: Download metadata from Lighthouse ──────────────────────────────

  console.log(`[2/4] Downloading TrustCoat metadata from Lighthouse...`)
  const tierData = {}

  for (const [tier, cid] of Object.entries(CURRENT_TIER_IPFS_CIDS)) {
    const url = `${LIGHTHOUSE_GATEWAY}/${cid}`
    console.log(`    Tier ${tier}: ${url}`)

    if (!DRY_RUN) {
      const buf = await fetchBuffer(url)
      const json = JSON.parse(buf.toString('utf8'))
      tierData[tier] = { cid, url, json, buffer: buf }
      console.log(`           ✓ ${buf.length} bytes — "${json.name || '(no name)'}"`)
    } else {
      console.log(`           [DRY RUN] Would download ${url}`)
      tierData[tier] = { cid, url, json: { name: `TrustCoat Tier ${tier}` }, buffer: Buffer.from('{}') }
    }
  }
  console.log()

  // ─── Step 3: Upload to Filecoin Onchain Cloud ───────────────────────────────

  console.log(`[3/4] Uploading to Filecoin Onchain Cloud (${NETWORK})...`)
  const uploadResults = {}

  if (!DRY_RUN) {
    const filChain = getChain(CHAIN_ID)
    const synapse = Synapse.create({
      chain: filChain,
      account,
      source: 'null-trustcoat-migration',
    })

    // Create one shared storage context for all uploads
    console.log('    Creating storage context (on-chain transaction)...')
    const context = await synapse.storage.createContext({
      callbacks: {
        onProviderSelected(provider) {
          console.log(`    Provider: ${provider.serviceProvider}`)
        },
        onDataSetResolved(info) {
          console.log(`    Dataset: ${info.dataSetId}`)
        },
      }
    })

    for (const [tier, data] of Object.entries(tierData)) {
      console.log(`    Uploading tier ${tier} metadata...`)

      // Convert Buffer to ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(data.buffer))
          controller.close()
        }
      })

      let pieceCid = null

      const result = await context.upload(stream, {
        pieceMetadata: { name: `trustcoat-tier-${tier}.json` },
        onStored(providerId, cid) {
          pieceCid = cid
          const url = context.getPieceUrl(cid)
          console.log(`    ✓ Tier ${tier}: ${cid.toString()}`)
          console.log(`           URL: ${url}`)
        },
      })

      const retrievalUrl = context.getPieceUrl(result.pieceCid ?? pieceCid)
      uploadResults[tier] = {
        pieceCid: (result.pieceCid ?? pieceCid).toString(),
        url: retrievalUrl,
        originalCid: data.cid,
      }
    }
  } else {
    // Dry run — simulate results
    console.log('    [DRY RUN] Simulating Filecoin Onchain Cloud upload...')
    for (const [tier, data] of Object.entries(tierData)) {
      const fakePieceCid = `baga6ea4seaq${tier}EXAMPLE_PIECE_CID_WOULD_BE_HERE`
      const fakeUrl = `https://pdp.storagemission.net/piece/${fakePieceCid}`
      uploadResults[tier] = {
        pieceCid: fakePieceCid,
        url: fakeUrl,
        originalCid: data.cid,
      }
      console.log(`    [DRY RUN] Tier ${tier}: ${fakeUrl}`)
    }
  }
  console.log()

  // ─── Step 4: Update TrustCoat contract on Base ──────────────────────────────

  console.log(`[4/4] Updating TrustCoat contract URIs on Base Mainnet...`)

  if (!DRY_RUN) {
    const baseAccount = privateKeyToAccount(pk)
    const baseClient = createWalletClient({
      account: baseAccount,
      chain: base,
      transport: http(),
    })
    const basePubClient = createPublicClient({ chain: base, transport: http() })

    for (const [tier, result] of Object.entries(uploadResults)) {
      const tierNum = parseInt(tier)
      console.log(`    Setting URI for tier ${tier}...`)
      console.log(`    → ${result.url}`)

      const hash = await baseClient.writeContract({
        address: TRUST_COAT_ADDRESS,
        abi: TRUST_COAT_ABI,
        functionName: 'setURI',
        args: [BigInt(tierNum), result.url],
      })

      const receipt = await basePubClient.waitForTransactionReceipt({ hash })
      console.log(`    ✓ Tier ${tier} updated. Tx: ${hash}`)

      uploadResults[tier].txHash = hash
      uploadResults[tier].blockNumber = receipt.blockNumber.toString()
    }
  } else {
    for (const [tier, result] of Object.entries(uploadResults)) {
      console.log(`    [DRY RUN] Would call setURI(${tier}, "${result.url}")`)
    }
  }
  console.log()

  // ─── Save receipt ────────────────────────────────────────────────────────────

  const receipt = {
    migratedAt: new Date().toISOString(),
    network: `filecoin-${NETWORK} (chainId ${CHAIN_ID})`,
    contract: TRUST_COAT_ADDRESS,
    contractChain: 'base-mainnet (chain-8453)',
    dryRun: DRY_RUN,
    tiers: uploadResults,
  }

  const receiptPath = path.join(ROOT, 'hackathon', 'filecoin-onchain-cloud-receipt.json')
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2))
  console.log(`Receipt saved: ${receiptPath}`)
  console.log()

  // ─── Summary ─────────────────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════════════════')
  console.log(DRY_RUN ? ' DRY RUN COMPLETE — no transactions sent' : ' MIGRATION COMPLETE')
  console.log('═══════════════════════════════════════════════════════')
  console.log()
  for (const [tier, result] of Object.entries(uploadResults)) {
    console.log(`  Tier ${tier}:`)
    console.log(`    PieceCID: ${result.pieceCid}`)
    console.log(`    URL:      ${result.url}`)
    if (result.txHash) console.log(`    Tx:       ${result.txHash}`)
  }
  console.log()
  console.log('Filecoin Onchain Cloud provides:')
  console.log('  ✓ On-chain storage proofs (PDP — Proof of Data Possession)')
  console.log('  ✓ Verifiable persistence via Filecoin network')
  console.log('  ✓ Programmable payments via FilecoinPay')
  console.log('  ✓ Retrieval via Filecoin Beam (incentivized CDN)')
  console.log()
}

main().catch((err) => {
  console.error('FATAL ERROR:', err.message || err)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})
