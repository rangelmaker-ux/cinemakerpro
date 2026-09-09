import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppStoreProvider } from '@/lib/store/local-store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Sidebar } from '@/components/navigation/Sidebar';

export const metadata: Metadata = {
  title: 'CineMaker Pro — Assistente do Videomaker',
  description:
    'Assistente operacional inteligente para videomakers: Diretor de Gravação IA com overlay visual em foto real, Mini CRM, Gestão de Kits e Integração com Agenda.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CineMaker Pro',
  },
};

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-background min-h-screen text-slate-100 flex antialiased selection:bg-brand/30">
        <AppStoreProvider>
          <AuthGuard>
            {/* Shell Responsivo Desktop + Mobile */}
            <div className="flex w-full min-h-screen">
              {/* Sidebar (Desktop) */}
              <Sidebar />

              {/* Conteúdo Principal Fluid (Desktop & Mobile) */}
              <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-background">
                <TopHeader />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
                  {children}
                </main>
                {/* Bottom Nav (Apenas Mobile) */}
                <BottomNav />
              </div>
            </div>
          </AuthGuard>
        </AppStoreProvider>
      </body>
    </html>
  );
}
