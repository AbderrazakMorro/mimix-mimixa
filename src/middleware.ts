import { NextResponse, type NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  let user = null;
  if (token) {
    user = await verifyJWT(token);
  }

  const url = request.nextUrl.clone();
  
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/signup');
  const isPublicPage = url.pathname === '/' || isAuthPage || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/');

  if (!user && !isPublicPage) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    url.pathname = '/profile-setup';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
