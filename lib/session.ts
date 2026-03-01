
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me')

export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 1 day

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day')
    .sign(key)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + SESSION_DURATION);
  const session = await encrypt({ userId, expires });
  const cookieStore = await cookies();

  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', 
    path: '/',
  })
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch {
    return null
  }
}

export async function updateSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value
  if (!session) return

  // Refresh expiration
  const parsed = await decrypt(session)
  parsed.expires = new Date(Date.now() + SESSION_DURATION)
  
  const res = new Response()
  res.headers.set('Set-Cookie', `session=${await encrypt(parsed)}; Path=/; HttpOnly; SameSite=Lax; Expires=${parsed.expires.toUTCString()}`)
  return res
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session')
}
