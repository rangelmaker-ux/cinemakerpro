import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  let token = req.cookies.get('gcal_token')?.value;
  const refreshToken = req.cookies.get('gcal_refresh_token')?.value;
  const email = req.cookies.get('gcal_email')?.value || null;

  // Se o token expirou mas temos refresh token, tenta renovar
  if (!token && refreshToken) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (clientId && clientSecret) {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.access_token) {
          token = refreshData.access_token;
        }
      }
    } catch (e) {
      console.error('Falha ao renovar token Google:', e);
    }
  }

  if (!token) {
    return NextResponse.json({
      connected: false,
      message: 'Nenhuma conta do Google Agenda conectada no momento.',
      events: [],
    });
  }

  try {
    const now = new Date().toISOString();
    // Busca os próximos 25 eventos na agenda primária do usuário Google
    const gcalUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    gcalUrl.searchParams.set('timeMin', now);
    gcalUrl.searchParams.set('singleEvents', 'true');
    gcalUrl.searchParams.set('orderBy', 'startTime');
    gcalUrl.searchParams.set('maxResults', '25');

    const gcalRes = await fetch(gcalUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!gcalRes.ok) {
      const errBody = await gcalRes.text();
      console.error('Erro na API Google Calendar:', gcalRes.status, errBody);
      return NextResponse.json(
        { connected: false, error: 'Falha ao buscar eventos da Google Agenda.', events: [] },
        { status: gcalRes.status }
      );
    }

    const data = await gcalRes.json();
    const formattedEvents = (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || 'Sem título',
      description: item.description || '',
      location: item.location || '',
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
      htmlLink: item.htmlLink,
    }));

    return NextResponse.json({
      connected: true,
      email,
      totalEvents: formattedEvents.length,
      events: formattedEvents,
    });
  } catch (error: any) {
    console.error('Erro ao comunicar com Google Calendar:', error);
    return NextResponse.json(
      { connected: false, error: error.message || 'Erro interno de rede com a Google.' },
      { status: 500 }
    );
  }
}

// Criar novo evento diretamente na Google Agenda Real
export async function POST(req: NextRequest) {
  const token = req.cookies.get('gcal_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Faça login com a sua conta Google para sincronizar.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, date, startTime = '09:00', durationMin = 180, location, description } = body;

    // Calcular data e hora de início e fim
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60000);

    const eventPayload = {
      summary: `🎬 CineMaker Pro: ${title || 'Diária de Gravação'}`,
      description: description || 'Diária agendada via CineMaker Pro.',
      location: location || '',
      start: {
        dateTime: startDateTime.toISOString(),
      },
      end: {
        dateTime: endDateTime.toISOString(),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 120 }, // Aviso 2h antes (tempo de deslocamento)
          { method: 'popup', minutes: 1440 }, // Aviso 1 dia antes
        ],
      },
    };

    const gcalRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    const result = await gcalRes.json();

    if (!gcalRes.ok) {
      console.error('Erro ao criar evento na Google Agenda:', result);
      return NextResponse.json({ success: false, error: result.error?.message || 'Falha na Google API' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      eventId: result.id,
      htmlLink: result.htmlLink,
      summary: result.summary,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
