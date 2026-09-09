import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gcal_token')?.value;
  const email = req.cookies.get('gcal_email')?.value || null;
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  return NextResponse.json({
    connected: Boolean(token),
    email,
    hasCredentialsConfigured: Boolean(clientId),
    redirectUri,
  });
}

// Desconectar / Limpar Sessão do Google Agenda
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Google Agenda desconectada.' });

  response.cookies.set('gcal_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('gcal_refresh_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('gcal_email', '', { maxAge: 0, path: '/' });

  return response;
}
