# Piff Paff Gym — Guia de Ativação de Backend (Supabase Free ou Firebase Firestore)

O **Piff Paff Gym** já funciona **100% pronto fora da caixa** com isolamento completo por `UID` usando o `LocalStorageAdapter` (ideal para demonstração imediata, uso offline PWA e deploy instantâneo na Vercel).

Quando quiser ativar persistência em nuvem gratuita multi-dispositivo, basta escolher uma das opções abaixo em `js/config.js`:

---

## Opção 1: Supabase Free (Recomendado)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto.
2. Abra o **SQL Editor** no painel do Supabase e execute o conteúdo completo do arquivo `database/supabase-rls.sql`.
3. Em **Project Settings → API**, copie `Project URL` e `anon public key`.
4. Em `js/config.js`, atualize:
   ```js
   BACKEND: {
     provider: 'supabase', // 'local' | 'supabase' | 'firestore'
     supabaseUrl: 'https://SEU-PROJETO.supabase.co',
     supabaseAnonKey: 'SUA_CHAVE_ANON_PUBLICA',
   }
   ```
5. Todas as leituras/escritas passarão a sincronizar via `SupabaseAdapter` respeitando as políticas RLS por `auth.uid()`.

---

## Opção 2: Firebase Firestore (Spark Free Plan)

1. Crie um projeto gratuito no [Firebase Console](https://console.firebase.google.com).
2. Ative **Authentication (Email/Password)** e **Cloud Firestore**.
3. Na aba **Firestore → Rules**, cole o conteúdo do arquivo `database/firestore.rules` e clique em **Publish**.
4. Em `js/config.js`, atualize:
   ```js
   BACKEND: {
     provider: 'firestore',
     firebaseConfig: {
       apiKey: 'SUA_API_KEY',
       authDomain: 'SEU_PROJETO.firebaseapp.com',
       projectId: 'SEU_PROJETO',
     }
   }
   ```

---

## Ativando Planos VIP no Futuro (Modular)

No lançamento, `APP_CONFIG.MONETIZATION.BILLING_ENABLED` está definido como `false` (100% gratuito para todos os usuários).
Para ativar planos VIP futuramente sem refatorar telas, altere apenas `js/config.js` e `js/modules/entitlements.js`.
