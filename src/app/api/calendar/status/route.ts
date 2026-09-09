import { NextRequest, NextResponse } from 'next/server';
import {
  disconnectGoogleForUser,
  getGoogleConnectionForUser,
} from '@/lib/server/google-account-store';

export async function GET(req: NextRequest) {
  const userId =
    req.nextUrl.searchParams.get('userId') ||
    req.headers.get('x-cinemaker-user-id') ||
    req.cookies.get('cinemaker_user_id')?.value ||
    '';
  const userEmail =
    req.nextUrl.searchParams.get('userEmail') ||
    req.cookies.get('cinemaker_user_email')?.value ||
    '';

  // 1. Checa se o usuário CineMaker Pro já possui conexão autorizada no servidor (Cross-Device)
  let accountConn = userId ? getGoogleConnectionForUser(userId) : null;
  if (!accountConn && userEmail) {
    accountConn = getGoogleConnectionForUser(userEmail);
  }

  // 2. Fallback para cookies locais
  const cookieToken = req.cookies.get('gcal_token')?.value;
  const cookieEmail = req.cookies.get('gcal_email')?.value || null;

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  const isConnected = Boolean(accountConn?.isConnected || cookieToken);
  const email = accountConn?.googleEmail || cookieEmail || null;
  const name = accountConn?.googleName || null;

  return NextResponse.json({
    connected: isConnected,
    email,
    name,
    accountPersisted: Boolean(accountConn?.isConnected),
    userId: accountConn?.userId || userId || null,
    hasCredentialsConfigured: Boolean(clientId),
    redirectUri,
  });
}

// Desconectar / Limpar Sessão do Google Agenda
export async function DELETE(req: NextRequest) {
  const userId =
    req.nextUrl.searchParams.get('userId') ||
    req.headers.get('x-cinemaker-user-id') ||
    req.cookies.get('cinemaker_user_id')?.value ||
    '';

  if (userId) {
    disconnectGoogleForUser(userId);
  }

  const response = NextResponse.json({ success: true, message: 'Google Agenda desconectada.' });

  response.cookies.set('gcal_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('gcal_refresh_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('gcal_email', '', { maxAge: 0, path: '/' });

  return response;
}
