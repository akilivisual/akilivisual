/**
 * One-time setup: creates the 'media' storage bucket in your AkiliVisual Supabase project.
 *
 * Run with:
 *   SUPABASE_SERVICE_ROLE_KEY=<your-key> npx tsx scripts/setup-storage.ts
 *
 * Your service role key is at:
 *   supabase.com/dashboard/project/zpdumcfqihpskailwcah/settings/api
 *   → "service_role" (secret key, never expose publicly)
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://zpdumcfqihpskailwcah.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run as: SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/setup-storage.ts')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

async function main() {
  console.log('Setting up AkiliVisual storage...\n')

  // ── Create media bucket ────────────────────────────────────────
  const { data: bucket, error: bucketErr } = await supabase.storage.createBucket('media', {
    public: true,
    allowedMimeTypes: ['image/*', 'video/*', 'audio/*'],
    fileSizeLimit: 104857600, // 100 MB
  })

  if (bucketErr) {
    if (bucketErr.message.toLowerCase().includes('already exists')) {
      console.log('✓ media bucket already exists')
    } else {
      console.error('✗ Failed to create bucket:', bucketErr.message)
      process.exit(1)
    }
  } else {
    console.log('✓ media bucket created:', bucket)
  }

  // ── Verify ────────────────────────────────────────────────────
  const { data: buckets } = await supabase.storage.listBuckets()
  console.log('\nAll buckets in this project:')
  buckets?.forEach((b) => console.log(`  • ${b.name} (public: ${b.public})`))

  console.log('\nDone. Upload something at /admin/media to test.')
}

main()
