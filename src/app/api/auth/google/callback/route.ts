import { NextRequest, NextResponse } from 'next/server';
import { setGoogleConnectionForUser } from '@/lib/server/google-account-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateParam = searchParams.get('state');

  // Recupera userId e userEmail do estado de autorização
  let stateUserId = '';
  let stateUserEmail = '';
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
      stateUserId = decoded.userId || '';
      stateUserEmail = decoded.userEmail || '';
    } catch (e) {
      stateUserId = stateParam;
    }
  }
  if (!stateUserId) {
    stateUserId = req.cookies.get('cinemaker_user_id')?.value || '';
  }
  if (!stateUserEmail) {
    stateUserEmail = req.cookies.get('cinemaker_user_email')?.value || '';
  }

  // Calcula dinamicamente o Redirect URI
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  if (error || !code) {
    const errorUrl = new URL('/agenda', req.url);
    errorUrl.searchParams.set('google_error', error || 'access_denied');
    return NextResponse.redirect(errorUrl);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const errUrl = new URL('/agenda', req.url);
      errUrl.searchParams.set('google_error', 'missing_credentials');
      return NextResponse.redirect(errUrl);
    }

    // Troca o código pelo token oficial de acesso
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Erro na troca do token Google:', tokenData);
      const errUrl = new URL('/perfil', req.url);
      errUrl.searchParams.set('google_error', 'token_exchange_failed');
      return NextResponse.redirect(errUrl);
    }

    // Busca os dados da conta Google conectada (email, nome)
    let userEmail = '';
    let userName = '';
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        userEmail = userInfo.email || '';
        userName = userInfo.name || '';
      }
    } catch (uErr) {
      console.error('Erro ao obter userinfo Google:', uErr);
    }

    // PERSISTÊNCIA NA CONTA CINEMAKER PRO (CROSS-DEVICE: Celular + Computador)
    const effectiveUserId = stateUserId || stateUserEmail || userEmail || 'default_user';
    setGoogleConnectionForUser(effectiveUserId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresInSec: tokenData.expires_in,
      googleEmail: userEmail,
      googleName: userName,
      userEmail: stateUserEmail || undefined,
    });

    // Redireciona com confirmação de sucesso para a Agenda Visual
    const successUrl = new URL('/agenda', req.url);
    successUrl.searchParams.set('google_connected', 'true');
    if (userEmail) successUrl.searchParams.set('google_email', userEmail);
    if (userName) successUrl.searchParams.set('google_name', userName);

    const response = NextResponse.redirect(successUrl);

    // Salva cookies HTTP-Only de sessão do Google Calendar
    response.cookies.set('gcal_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenData.expires_in || 3600,
      path: '/',
      sameSite: 'lax',
    });

    if (tokenData.refresh_token) {
      response.cookies.set('gcal_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/',
        sameSite: 'lax',
      });
    }

    if (userEmail) {
      response.cookies.set('gcal_email', userEmail, {
        httpOnly: false, // Legível pelo front
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    console.error('Falha geral no callback Google:', error);
    const errUrl = new URL('/perfil', req.url);
    errUrl.searchParams.set('google_error', 'server_error');
    return NextResponse.redirect(errUrl);
  }
}
