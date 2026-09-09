import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gcal_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Conecte sua conta Google para sincronizar as gravações.' },
      { status: 401 }
    );
  }

  try {
    const { shoots = [] } = await req.json();

    const syncedResults = [];

    for (const shoot of shoots) {
      if (!shoot.scheduled_at) continue;

      const startDate = new Date(shoot.scheduled_at);
      const durationMin = shoot.estimated_duration_min || 180;
      const endDate = new Date(startDate.getTime() + durationMin * 60000);

      const eventPayload = {
        summary: `🎬 CineMaker Pro: ${shoot.title || 'Diária de Gravação'}`,
        description: `Diária de Gravação CineMaker Pro\nLocal: ${shoot.location_address || 'Estúdio'}\nChecklist e equipamentos configurados no app.`,
        location: shoot.location_address || '',
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
      };

      try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });

        if (res.ok) {
          const data = await res.json();
          syncedResults.push({ shootId: shoot.id, eventId: data.id, htmlLink: data.htmlLink });
        }
      } catch (err) {
        console.error('Erro ao sincronizar diária com Google:', shoot.id, err);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedResults.length,
      syncedResults,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
