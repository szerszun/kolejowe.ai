import { fetchRouteWays, buildLine, haversineKm } from './overpass.ts'

async function main() {
  console.log('Fetching route ways for line 274...')
  const start = Date.now()
  const result = await fetchRouteWays('274')
  console.log(`fetchRouteWays done in ${((Date.now() - start) / 1000).toFixed(1)}s`)
  if (!result) {
    console.log('No relation found for ref 274')
    return
  }
  console.log(`relationId=${result.relationId}, segments=${result.segments.length}`)

  const built = buildLine(result.segments)
  console.log('--- buildLine result ---')
  console.log('segsTotal:', built.segsTotal)
  console.log('lengthKm (best chain):', built.lengthKm)
  console.log('chain point count:', built.chain.length)
  console.log('allChains count:', built.allChains.length)
  for (const c of built.allChains) {
    console.log(`  chain: points=${c.points} lengthKm=${c.lengthKm}`)
  }

  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity
  for (const [lon, lat] of built.chain) {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  console.log(`bbox: lon [${minLon}, ${maxLon}], lat [${minLat}, ${maxLat}]`)

  let maxGap = 0
  let maxGapIdx = -1
  for (let i = 0; i < built.chain.length - 1; i++) {
    const d = haversineKm(built.chain[i], built.chain[i + 1])
    if (d > maxGap) {
      maxGap = d
      maxGapIdx = i
    }
  }
  console.log(`largest consecutive-point gap in chain: ${maxGap.toFixed(3)} km at index ${maxGapIdx}`)

  const fs = await import('fs')
  fs.writeFileSync(
    '/tmp/line274_chain.json',
    JSON.stringify({
      chain: built.chain,
      lengthKm: built.lengthKm,
      maxGap,
      allChains: built.allChains,
      top3ChainsFull: built.allChainsFull.slice(0, 3),
    }),
  )
  console.log('wrote /tmp/line274_chain.json')
}

main().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
