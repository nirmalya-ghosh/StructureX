import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) {
      return value
    }
  }

  return ''
}

function getSupabaseClient() {
  const supabaseUrl = readEnv(
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'VITE_SUPABASE_URL'
  )
  const supabaseAnonKey = readEnv(
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY'
  )

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in Vercel environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

function getEncryptionKey() {
  const rawKey = readEnv('ENCRYPTION_KEY')
  if (!rawKey) {
    throw new Error('Missing ENCRYPTION_KEY in Vercel environment variables')
  }

  const hexKey = rawKey.startsWith('hex:') ? rawKey.slice(4) : rawKey
  if (/^[0-9a-f]{64}$/i.test(hexKey)) {
    return Buffer.from(hexKey, 'hex')
  }

  return crypto.createHash('sha256').update(rawKey, 'utf8').digest()
}

function encrypt(text) {
  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ])

  const tag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: tag.toString('hex')
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data } = req.body || {}
    if (data === undefined || data === null) {
      return res.status(400).json({ error: 'Missing data field' })
    }

    const plaintext = typeof data === 'string' ? data : JSON.stringify(data)
    const encrypted = encrypt(plaintext)
    const supabase = getSupabaseClient()

    const { error } = await supabase.from('secure_data').insert([encrypted])

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Saved securely' })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Secure save failed' })
  }
}
