import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-romantic-key-for-mimix';
const key = new TextEncoder().encode(JWT_SECRET);

export async function signJWT(payload: any, expiresIn: string = '7d'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyJWT(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (err) {
    return null;
  }
}
