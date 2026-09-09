import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppStoreProvider } from '@/lib/store/local-store';
import { AuthGuard } from '@/components/auth/AuthGuard';

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
          <AuthGuard>{children}</AuthGuard>
        </AppStoreProvider>
      </body>
    </html>
  );
}
