import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Calcula dinamicamente o Redirect URI baseado no host atual (Vercel ou Local)
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  // Se o Client ID não estiver configurado nas variáveis da Vercel ou .env,
  // redirecionamos com aviso explicativo e o redirectUri pronto para cópia
  if (!clientId) {
    const errorUrl = new URL('/perfil', req.url);
    errorUrl.searchParams.set('google_error', 'missing_credentials');
    errorUrl.searchParams.set('redirect_uri', redirectUri);
    return NextResponse.redirect(errorUrl);
  }

  // Escopos Oficiais para Leitura e Criação de Eventos na Google Agenda do Usuário
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ].join(' ');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', scopes);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(googleAuthUrl);
}
