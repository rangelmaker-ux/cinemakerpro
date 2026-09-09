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

  // Extrai identificador da conta do CineMaker Pro (para persistência no nível de conta)
  const userId =
    req.nextUrl.searchParams.get('userId') ||
    req.cookies.get('cinemaker_user_id')?.value ||
    '';
  const userEmail =
    req.nextUrl.searchParams.get('userEmail') ||
    req.cookies.get('cinemaker_user_email')?.value ||
    '';

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', scopes);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');

  // Codifica estado com userId e userEmail para recuperar no callback
  const stateData = Buffer.from(JSON.stringify({ userId, userEmail })).toString('base64url');
  googleAuthUrl.searchParams.set('state', stateData);

  const res = NextResponse.redirect(googleAuthUrl);
  if (userId) {
    res.cookies.set('cinemaker_user_id', userId, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
    });
  }
  if (userEmail) {
    res.cookies.set('cinemaker_user_email', userEmail, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
    });
  }

  return res;
}
