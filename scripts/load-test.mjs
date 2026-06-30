#!/usr/bin/env node
/**
 * Load test for POST /api/v1/licenses/verify
 *
 * Usage:
 *   node scripts/load-test.mjs [license_key] [concurrency] [duration_secs]
 *
 * Examples:
 *   node scripts/load-test.mjs XXXXX-XXXXX-XXXXX-XXXXX 10 10
 *   node scripts/load-test.mjs invalid-key 20 15
 *
 * Target: p95 < 100ms under 100 req/s
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const LICENSE_KEY = process.argv[2] ?? 'TEST-00000-00000-00000'
const CONCURRENCY = Number(process.argv[3] ?? 10)
const DURATION_SECS = Number(process.argv[4] ?? 10)

const endpoint = `${BASE_URL}/api/v1/licenses/verify`
const body = JSON.stringify({ license_key: LICENSE_KEY })

const latencies = []
let completed = 0
let errors = 0

async function doRequest() {
  const start = performance.now()
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    await res.json()
    latencies.push(performance.now() - start)
    completed++
  } catch {
    errors++
  }
}

async function worker(endAt) {
  while (Date.now() < endAt) {
    await doRequest()
  }
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)].toFixed(1)
}

console.log(`\nLoad test: ${endpoint}`)
console.log(`Concurrency: ${CONCURRENCY} | Duration: ${DURATION_SECS}s | Key: ${LICENSE_KEY}\n`)

const endAt = Date.now() + DURATION_SECS * 1000
const workers = Array.from({ length: CONCURRENCY }, () => worker(endAt))
await Promise.all(workers)

latencies.sort((a, b) => a - b)

const total = completed + errors
const rps = (total / DURATION_SECS).toFixed(1)
const avg = (latencies.reduce((s, v) => s + v, 0) / latencies.length).toFixed(1)
const p50 = percentile(latencies, 50)
const p95 = percentile(latencies, 95)
const p99 = percentile(latencies, 99)
const min = latencies[0]?.toFixed(1) ?? 'N/A'
const max = latencies[latencies.length - 1]?.toFixed(1) ?? 'N/A'

console.log(`Results:`)
console.log(`  Requests:   ${total} (${completed} ok, ${errors} errors)`)
console.log(`  RPS:        ${rps}`)
console.log(`  Latency:`)
console.log(`    min  ${min} ms`)
console.log(`    avg  ${avg} ms`)
console.log(`    p50  ${p50} ms`)
console.log(`    p95  ${p95} ms   ${Number(p95) < 100 ? '✓ TARGET MET' : '✗ ABOVE TARGET (goal: <100ms)'}`)
console.log(`    p99  ${p99} ms`)
console.log(`    max  ${max} ms`)
console.log()
