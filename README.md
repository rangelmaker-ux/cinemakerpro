# CineMaker Pro — Assistente do Videomaker 🎬

> **"Um assistente inteligente que conhece seu equipamento, entende o ambiente, ensina onde posicionar tudo, organiza sua gravação e acompanha seu trabalho do primeiro contato ao pós-venda."**

Desenvolvido por **Rangel Maker** ([@rangelmaker_](https://www.instagram.com/rangelmaker_/)).

---

## 🌟 O Grande Diferencial: Diretor de Gravação IA

Ao contrário de CRMs genéricos ou meros aplicativos de anotação, o **CineMaker Pro** possui um motor espacial que analisa a foto real do ambiente e desenha visualmente (*overlay* vetorial interativo):
- 📷 **Onde colocar a Câmera** (altura na linha dos olhos, distância focal real do kit e enquadramento ideal).
- 👤 **Onde posicionar a Pessoa** (distância da parede para evitar sombras chapadas e ângulo em relação à luz).
- 💡 **Onde posicionar a Luz Principal** (ângulo de 45°, altura e modificador recomendado).
- ☀️ **Onde colocar o Contraluz / Rim Light** (para descolar o sujeito do fundo).
- 🎙️ **Onde posicionar o Microfone** (prevenindo ruídos de ar-condicionado e eco).
- ⚠️ **Botão "Não consigo colocar aqui"**: A IA recalcula uma alternativa física em menos de 2 segundos contornando obstáculos.
- ❓ **Botão "Por quê?"**: Explica didaticamente os fundamentos cinematográficos da recomendação.
- 📸 **Testar Enquadramento**: Validação prática de *headroom*, altura e balanço de luz antes de começar a gravar.
- 📋 **Plano de Cenas & Checklist**: Cenas 1 a 4 com movimentos sugeridos e checagem de baterias/áudio no set.

---

## 🛠️ Stack Tecnológica (Vercel & Supabase Ready)

- **Frontend**: Next.js 14/15 (App Router, React 18/19, TypeScript)
- **Estilização**: TailwindCSS (Design System Dark Premium) + Lucide Icons
- **Banco de Dados**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel (Zero-config Serverless)
- **PWA**: Instalável como aplicativo nativo no iPhone e Android

---

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Rodar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

---

## ⚡ Conectando com o Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Acesse o **SQL Editor** do seu painel Supabase.
3. Copie e cole todo o conteúdo do arquivo:
   ```text
   supabase/migrations/20260908_init.sql
   ```
4. Execute o script. Todas as tabelas (`users`, `equipments`, `kits`, `clients`, `shoots`, `takes`, etc.) e políticas de RLS serão criadas automaticamente.
5. Adicione suas credenciais no `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

---

## 🌐 Como Subir na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2. Importe o repositório: `rangelmaker-ux/cinemakerpro`.
3. Nas configurações de **Environment Variables**, adicione (opcionalmente):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (se desejar provedor externo)
4. Clique em **Deploy**. O projeto estará no ar em menos de 2 minutos!

---

## 📱 Instalação como App no Smartphone (PWA)

- **No iOS (Safari)**: Toque no botão de compartilhar (ícone de quadrado com seta para cima) → **"Adicionar à Tela de Início"**.
- **No Android (Chrome)**: Toque nos três pontinhos → **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
