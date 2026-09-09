import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/perfil?google_error=no_code', req.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('Erro na troca do token Google:', tokenData);
      return NextResponse.redirect(new URL('/perfil?google_error=token_exchange', req.url));
    }

    // Sucesso na conexão oficial
    const successUrl = new URL('/perfil?google_connected=true', req.url);
    const response = NextResponse.redirect(successUrl);

    // Salvar token em cookie HTTP-Only seguro para uso pelas rotas de calendário
    if (tokenData.access_token) {
      response.cookies.set('gcal_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Falha no callback Google:', error);
    return NextResponse.redirect(new URL('/perfil?google_error=server_error', req.url));
  }
}
