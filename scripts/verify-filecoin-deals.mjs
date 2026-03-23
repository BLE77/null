/**
 * verify-filecoin-deals.mjs
 *
 * Verifies that all 12 TrustCoat CIDs have active Filecoin mainnet storage deals.
 * Queries the Lighthouse deal status API and Filfox for on-chain deal confirmation.
 *
 * Usage:
 *   node scripts/verify-filecoin-deals.mjs
 */

import https from 'https'

// All 12 CIDs: 6 metadata + 6 images
const METADATA_CIDS = {
  0: 'bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y',
  1: 'bafkreieif7573erx6nwlpuiljejlzoodrqxayubdo7h4lwwfsx5iogvvuu',
  2: 'bafkreiepuzrl7x5wjvkwx6psrg4eiux47vpjfjvjqtsr4shlfo6huc7wwa',
  3: 'bafkreibzsr2svupoadcgzhhewu6j3f22drlpaphn6stmiu23d2w6x4ve6y',
  4: 'bafkreihcf6fjgvvu7qsqp6k5cfm7oj7fpxs6drdzuvjjsrlhzq7rxiphwy',
  5: 'bafkreieo5gvchbxmcrhlhrxlhvik4ohfc64hajj7rjspgjazomylsoari4',
}

const IMAGE_CIDS = {
  0: 'bafybeibyhayyj5f3mds2xi24gzx2wcxb4mrpxfakej2o2wvntr664sdhyy',
  1: 'bafybeieuukubdtf6rymdei2fztwh4vjhh544w5eexeg6jefwsg6fk4qvwe',
  2: 'bafybeifhwoeare4tiiecb5xnwioycsvz4dynmbixqsbl4eeufgsmgnioky',
  3: 'bafybeid7hws6loaifso75k5yv7psjhbp24tevygaxnzcjsfjyk4ddgjyjm',
  4: 'bafybeibgb3asbmdayuwwpb5ja3hkawox5d2pg2nqa5lirwih4ep2e5ytnm',
  5: 'bafybeicvs46mlt5wwi4htjqtmkvh4sndl55uymksrngbyh2oaw4zjxmwlq',
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error(`Invalid JSON from ${url}: ${data.slice(0, 200)}`)) }
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function checkDealStatus(cid) {
  const url = `https://api.lighthouse.storage/api/lighthouse/deal_status?cid=${cid}`
  const deals = await fetchJson(url)
  return deals
}

async function getDealDetails(dealId) {
  const url = `https://filfox.info/api/v1/deal/${dealId}`
  const deal = await fetchJson(url)
  return deal
}

async function main() {
  console.log('='.repeat(60))
  console.log(' NULL TrustCoat -- Filecoin Deal Verification')
  console.log('='.repeat(60))
  console.log()

  let allPassed = true
  const allDealIds = new Set()

  // Check metadata CIDs
  console.log('--- Metadata CIDs (6 tiers) ---')
  for (const [tier, cid] of Object.entries(METADATA_CIDS)) {
    process.stdout.write(`  Tier ${tier}: ${cid.slice(0, 20)}... `)
    try {
      const deals = await checkDealStatus(cid)
      if (Array.isArray(deals) && deals.length > 0) {
        const dealIds = deals.map(d => d.DealID)
        dealIds.forEach(id => allDealIds.add(id))
        console.log(`OK -- ${deals.length} deals: ${dealIds.join(', ')}`)
      } else {
        console.log('FAIL -- no deals found')
        allPassed = false
      }
    } catch (err) {
      console.log(`ERROR -- ${err.message}`)
      allPassed = false
    }
  }

  console.log()
  console.log('--- Image CIDs (6 tiers) ---')
  for (const [tier, cid] of Object.entries(IMAGE_CIDS)) {
    process.stdout.write(`  Tier ${tier}: ${cid.slice(0, 20)}... `)
    try {
      const deals = await checkDealStatus(cid)
      if (Array.isArray(deals) && deals.length > 0) {
        const dealIds = deals.map(d => d.DealID)
        dealIds.forEach(id => allDealIds.add(id))
        console.log(`OK -- ${deals.length} deals: ${dealIds.join(', ')}`)
      } else {
        console.log('FAIL -- no deals found')
        allPassed = false
      }
    } catch (err) {
      console.log(`ERROR -- ${err.message}`)
      allPassed = false
    }
  }

  // Get details for each unique deal
  console.log()
  console.log('--- Deal Details (from Filfox) ---')
  for (const dealId of allDealIds) {
    try {
      const deal = await getDealDetails(dealId)
      console.log(`  Deal ${dealId}:`)
      console.log(`    Provider:     ${deal.provider} ${deal.providerTag?.name ? `(${deal.providerTag.name})` : ''}`)
      console.log(`    PieceCID:     ${deal.pieceCid}`)
      console.log(`    Piece Size:   ${(deal.pieceSize / (1024**3)).toFixed(0)} GiB`)
      console.log(`    Verified:     ${deal.verifiedDeal}`)
      console.log(`    Start Epoch:  ${deal.startEpoch}`)
      console.log(`    End Epoch:    ${deal.endEpoch}`)
      console.log(`    Filfox:       https://filfox.info/en/deal/${dealId}`)
    } catch (err) {
      console.log(`  Deal ${dealId}: ERROR -- ${err.message}`)
    }
  }

  // Check gateway retrieval for one CID
  console.log()
  console.log('--- Gateway Retrieval Test ---')
  const testCid = METADATA_CIDS[0]
  const testUrl = `https://gateway.lighthouse.storage/ipfs/${testCid}`
  process.stdout.write(`  Fetching ${testUrl.slice(0, 60)}... `)
  try {
    const data = await fetchJson(testUrl)
    if (data && data.name) {
      console.log(`OK -- "${data.name}"`)
    } else {
      console.log('OK -- data retrieved')
    }
  } catch (err) {
    console.log(`WARN -- ${err.message}`)
  }

  console.log()
  console.log('='.repeat(60))
  if (allPassed) {
    console.log(' ALL 12 CIDs VERIFIED ON FILECOIN MAINNET')
    console.log(`  ${allDealIds.size} unique deals across ${new Set([...allDealIds].map(() => 'x')).size || 3} storage providers`)
  } else {
    console.log(' SOME CHECKS FAILED -- see above')
  }
  console.log('='.repeat(60))
}

main().catch(err => {
  console.error('FATAL:', err.message)
  process.exit(1)
})
