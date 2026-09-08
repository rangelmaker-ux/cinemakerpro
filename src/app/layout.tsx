import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppStoreProvider } from '@/lib/store/local-store';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';

export const metadata: Metadata = {
  title: 'CineMaker Pro — Assistente do Videomaker',
  description:
    'Assistente operacional inteligente para videomakers: Diretor de Gravação IA com overlay visual em foto real, Mini CRM, Gestão de Kits e Integração com Agenda.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CineMaker Pro',
  },
};

export const viewport: Viewport = {
  themeColor: '#080a0f',
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
      <body className="bg-background min-h-screen text-slate-100 flex flex-col antialiased selection:bg-brand/30">
        <AppStoreProvider>
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full min-h-screen shadow-2xl bg-background border-x border-surface-border/40">
            <TopHeader />
            <main className="flex-1 pb-24 px-4 pt-3">{children}</main>
            <BottomNav />
          </div>
        </AppStoreProvider>
      </body>
    </html>
  );
}
