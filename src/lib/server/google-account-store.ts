import fs from 'fs';
import path from 'path';

/**
 * ARMAZENAMENTO DA CONEXÃO GOOGLE CALENDAR POR CONTA CINEMAKER PRO (Seção 28 a 34 do Master Prompt)
 *
 * Princípio Arquitetural:
 * A autorização do Google Agenda pertence à CONTA DO USUÁRIO CineMaker Pro (associada ao user_id).
 * NÃO pertence apenas ao navegador, cookies locais ou a um único aparelho.
 * O usuário pode logar no Computador, no Celular ou em outro aparelho e a conexão persiste.
 */

export interface GoogleAccountConnection {
  userId: string;
  userEmail?: string;
  googleEmail: string;
  googleName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Timestamp em ms
  connectedAt: string;
  isConnected: boolean;
}

// Arquivo de persistência no servidor (persistente entre reinicializações)
const DATA_DIR = path.join(process.cwd(), '.system_generated');
const STORE_FILE = path.join(DATA_DIR, 'google-account-connections.json');

// Cache em memória para acesso ultra-rápido
const memoryStore = new Map<string, GoogleAccountConnection>();

function ensureDirExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.error('Erro ao criar diretório de dados:', e);
  }
}

function loadFromFile() {
  try {
    ensureDirExists();
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed: Record<string, GoogleAccountConnection> = JSON.parse(data);
      for (const [userId, conn] of Object.entries(parsed)) {
        memoryStore.set(userId, conn);
      }
    }
  } catch (e) {
    console.error('Erro ao ler conexões Google salvas:', e);
  }
}

function saveToFile() {
  try {
    ensureDirExists();
    const obj: Record<string, GoogleAccountConnection> = {};
    memoryStore.forEach((conn, userId) => {
      obj[userId] = conn;
    });
    fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar conexões Google no disco:', e);
  }
}

// Inicializar na carga do módulo
loadFromFile();

/**
 * Salva ou atualiza a conexão do Google Calendar para o usuário CineMaker
 */
export function setGoogleConnectionForUser(
  userId: string,
  data: {
    accessToken: string;
    refreshToken?: string;
    expiresInSec?: number;
    googleEmail: string;
    googleName?: string;
    userEmail?: string;
  }
): GoogleAccountConnection {
  loadFromFile();
  const existing = memoryStore.get(userId);

  const expiresAt = Date.now() + (data.expiresInSec ? data.expiresInSec * 1000 : 3600 * 1000);

  const connection: GoogleAccountConnection = {
    userId,
    userEmail: data.userEmail || existing?.userEmail,
    googleEmail: data.googleEmail || existing?.googleEmail || '',
    googleName: data.googleName || existing?.googleName || '',
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || existing?.refreshToken,
    expiresAt,
    connectedAt: existing?.connectedAt || new Date().toISOString(),
    isConnected: true,
  };

  memoryStore.set(userId, connection);
  if (connection.userEmail) {
    memoryStore.set(`email:${connection.userEmail.toLowerCase()}`, connection);
  }
  saveToFile();
  return connection;
}

/**
 * Recupera a conexão do Google Agenda para um usuário CineMaker (por userId ou email)
 */
export function getGoogleConnectionForUser(userIdOrEmail: string): GoogleAccountConnection | null {
  if (!userIdOrEmail) return null;
  loadFromFile();

  let conn = memoryStore.get(userIdOrEmail);
  if (!conn && userIdOrEmail.includes('@')) {
    conn = memoryStore.get(`email:${userIdOrEmail.toLowerCase()}`);
  }
  if (!conn) {
    memoryStore.forEach((c) => {
      if (!conn && (c.userId === userIdOrEmail || (c.userEmail && c.userEmail.toLowerCase() === userIdOrEmail.toLowerCase()))) {
        conn = c;
      }
    });
  }

  if (!conn || !conn.isConnected) return null;
  return conn;
}

/**
 * Desconecta explicitamente o Google Agenda da conta CineMaker
 */
export function disconnectGoogleForUser(userId: string): boolean {
  loadFromFile();
  const conn = getGoogleConnectionForUser(userId);
  if (conn) {
    conn.isConnected = false;
    memoryStore.set(conn.userId, conn);
    if (conn.userEmail) {
      memoryStore.set(`email:${conn.userEmail.toLowerCase()}`, conn);
    }
    saveToFile();
    return true;
  }
  return false;
}

/**
 * Garante que o token de acesso seja válido, renovando com o refresh token se necessário
 */
export async function getValidAccessTokenForUser(userId: string): Promise<string | null> {
  const conn = getGoogleConnectionForUser(userId);
  if (!conn) return null;

  // Se o token ainda é válido por mais de 5 minutos
  if (conn.accessToken && conn.expiresAt > Date.now() + 5 * 60 * 1000) {
    return conn.accessToken;
  }

  // Se expirou e temos refresh_token, renova no Google OAuth
  if (conn.refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (clientId && clientSecret) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: conn.refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            conn.accessToken = refreshData.access_token;
            conn.expiresAt = Date.now() + (refreshData.expires_in || 3600) * 1000;
            memoryStore.set(userId, conn);
            saveToFile();
            return conn.accessToken;
          }
        }
      } catch (e) {
        console.error('Falha ao renovar token Google OAuth para usuário:', userId, e);
      }
    }
  }

  return conn.accessToken || null;
}
