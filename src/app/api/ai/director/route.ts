import { NextRequest, NextResponse } from 'next/server';
import { generateAIDirectorLayout } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoType = 'institucional', mode = 'recomendado', userEquipment = [], blockedZones = [] } = body;

    const spatialData = generateAIDirectorLayout({
      videoType,
      mode,
      userEquipment,
      blockedZones,
    });

    return NextResponse.json({
      success: true,
      data: spatialData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar análise do Diretor IA',
      },
      { status: 500 }
    );
  }
}
