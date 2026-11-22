# ⚡ Piff Paff Gym — PWA de Performance, Treino Pro & Evolução Física

Aplicativo web completo, responsivo e instalável como **PWA (iOS & Android)** com identidade visual **Dark Premium** (`#09090b`, `#121215`, Esmeralda `#10b981`, Dourado/Âmbar `#f59e0b` e fonte `Inter`).

**100% GRATUITO no lançamento** (sem paywall ou cobrança), com arquitetura modular (`js/config.js` e `js/modules/entitlements.js`) pronta para ativar Planos VIP no futuro.

---

## Contas Demo Prontas para Teste Imediato

| Perfil | Login | Senha | Destaque |
| :--- | :--- | :--- | :--- |
| **Admin Master** | `admin` | `admin123` | Aba exclusiva **Admin CRM**, criação de usuários e botão **Entrar nesta Conta** (Impersonate com barra dourada) |
| **Lucas Silva (Iniciante)** | `iniciante` | `123456` | Modo Casa · Matriz Atlético & Seco · **Meta Inversa** de perda de peso (`94kg → 82kg`) |
| **Mariana Costa (Intermediário)** | `intermediario` | `123456` | Academia · Matriz Ampulheta & Glúteos · Evolução de Hip Thrust & Fotos |
| **Rafael Mendes (Atleta Pro)** | `pro` | `123456` | Academia · Matriz Shape em V com **FST-7 / Rest-Pause / Drop-Set / RPE 9–10** |

---

## Principais Funcionalidades

1. **Login, Cadastro Público Gratuito & Isolamento Total por UID**:
   - Cada usuário possui dados completamente isolados pelo seu `UID`.
   - Adaptador modular pronto para **Supabase Free** (`database/supabase-rls.sql`) e **Firebase Firestore** (`database/firestore.rules`).
   - **Admin CRM** exclusivo do Admin Master com criação de usuários e modo **Impersonate** (`Entrar nesta Conta`) com barra de aviso dourada fixa no topo.
2. **Seletor 1 Clique de Local & Nível Dinâmico**:
   - **Local**: `Academia Completa`, `Treino em Casa`, `Híbrido / Viagem`.
   - **Nível**: `Iniciante`, `Intermediário`, `Atleta Pro` (injeta automaticamente protocolos **FST-7**, **Rest-Pause**, **Drop-Set** e **RPE 9–10**).
3. **4 Matrizes Pro + Gerador de Treino Personalizado**:
   - **Shape em V** (*Hany Rambod & CBum*)
   - **Massa & Densidade** (*Dorian Yates & Arnold*)
   - **Ampulheta & Glúteos** (*Bret Contreras & Wellness Pro*)
   - **Atlético & Seco** (*Jeff Nippard*)
   - Checklist interativo de séries, botões `+/-` de carga, cronômetro de descanso fixo no topo (com aviso sonoro e auto-start) e botão **Finalizar Treino** somando pontos no **Score Piff Paff Gym**.
4. **Metas & Gamificação**:
   - Categorias **Força**, **Peso/Estética** (com cálculo automático de **metas inversas** de perda de peso/BF%), **Constância** e **Performance Pro**, além de Patentes e Conquistas.
5. **Evolução Física + Card 9:16 para Instagram Stories**:
   - Upload gratuito de fotos com compressão Canvas automática, **Guia Prático de Fotos**, comparador **Antes vs. Depois** (Lado a Lado e Slider) com diferença de peso e gerador de **Card 9:16 (`1080×1920`)** em HTML5 Canvas pronto para **Web Share API** (Stories) e **Download PNG**.
6. **Gráficos Interativos (Chart.js)**:
   - Histórico de Cargas (**Inicial**, **PR Atual**, **% de Ganho**).
   - Peso Corporal vs. Meta + **IMC** + **% de Gordura** (manual ou fita métrica US Navy — sem balanças inteligentes).
7. **Hidratação, Proteínas, Biblioteca de Dicas & Spotify**:
   - Hidratação diária automática (`35 ml/kg`), meta de proteínas (`1.6g` a `2.2g/kg`), biblioteca filtrável de dicas (`Casa` / `Academia` / `Híbrido`) e **Spotify Integrado** (`Beast Mode`, `Gym Phonk`, `Eletrônica`, `Heavy Workout` + link pessoal) com **Mini-Player flutuante** durante os treinos.

---

## Deploy na Vercel

O repositório já inclui `vercel.json`, `manifest.json`, `sw.js` e ícones PWA (`icons/`):

1. Importe o repositório `Academia-` na [Vercel](https://vercel.com).
2. Deixe **Framework Preset** como `Other` (estático, sem necessidade de build).
3. Clique em **Deploy** — o app sobe pronto com PWA instalável para iOS e Android!

---

## Ativando Banco em Nuvem (Opcional)

Consulte [`database/SETUP_BACKEND.md`](database/SETUP_BACKEND.md) para conectar **Supabase Free** ou **Firebase Firestore** usando os arquivos `database/supabase-rls.sql` e `database/firestore.rules`.
