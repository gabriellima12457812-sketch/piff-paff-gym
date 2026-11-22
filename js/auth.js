/**
 * Piff Paff Gym — Autenticação Pública Gratuita, Isolamento por UID & Admin Impersonate
 */

import { storage, createEmptyUserData } from './storage.js';
import { seedDemoAccountsIfNeeded } from './data/demo-users.js';

export function generateUid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `uid_${crypto.randomUUID().slice(0, 12)}`;
  }
  return `uid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const auth = {
  init() {
    seedDemoAccountsIfNeeded();
  },

  getSession() {
    return storage.getSession();
  },

  getActiveUser() {
    const session = storage.getSession();
    if (!session?.activeUid) return null;
    return storage.getUserByUid(session.activeUid);
  },

  getImpersonator() {
    const session = storage.getSession();
    if (!session?.impersonatorUid) return null;
    return storage.getUserByUid(session.impersonatorUid);
  },

  isImpersonating() {
    const session = storage.getSession();
    return Boolean(session?.impersonatorUid && session.impersonatorUid !== session.activeUid);
  },

  login(identifier, password) {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();
    if (!cleanId || !cleanPass) {
      return { ok: false, error: 'Informe seu login/e-mail e senha.' };
    }

    const users = storage.getUsers();
    const found = users.find(
      (u) =>
        (u.username?.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId) &&
        u.passwordHash === cleanPass
    );

    if (!found) {
      return { ok: false, error: 'Usuário ou senha incorretos.' };
    }

    storage.saveSession({
      activeUid: found.uid,
      impersonatorUid: null,
      loggedInAt: new Date().toISOString(),
    });

    // Garante inicialização isolada de dados do UID
    storage.getUserData(found.uid, found);
    return { ok: true, user: found };
  },

  register({ name, username, email, password, level = 'beginner', location = 'gym', weightKg = 75, heightCm = 175, goalWeightKg = 75, gender = 'male', role = 'athlete' }) {
    const cleanName = String(name || '').trim();
    const cleanUser = String(username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { ok: false, error: 'Informe seu nome completo.' };
    }
    if (!cleanUser || cleanUser.length < 3) {
      return { ok: false, error: 'O nome de usuário deve ter pelo menos 3 caracteres (letras/números).' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { ok: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
    }

    const users = storage.getUsers();
    const exists = users.some(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (exists) {
      return { ok: false, error: 'Este nome de usuário ou e-mail já está em uso.' };
    }

    const newUser = {
      uid: generateUid(),
      username: cleanUser,
      email: cleanEmail || `${cleanUser}@piffpaffgym.local`,
      passwordHash: cleanPass,
      name: cleanName,
      role: role === 'admin' ? 'admin' : 'athlete',
      tier: 'free_launch',
      level,
      location,
      weightKg: Number(weightKg) || 75,
      heightCm: Number(heightCm) || 175,
      goalWeightKg: Number(goalWeightKg) || Number(weightKg) || 75,
      gender,
      createdAt: new Date().toISOString(),
    };

    storage.upsertUser(newUser);

    // Cria bucket completamente isolado para o novo UID
    const initialData = createEmptyUserData(newUser);
    // Se meta de peso for menor que peso atual, já cria meta inversa pronta!
    if (newUser.goalWeightKg < newUser.weightKg) {
      initialData.goals.push({
        id: `g_init_${Date.now()}`,
        title: `Chegar a ${newUser.goalWeightKg}kg (Perda de Peso)`,
        category: 'peso',
        direction: 'down',
        startValue: newUser.weightKg,
        currentValue: newUser.weightKg,
        targetValue: newUser.goalWeightKg,
        unit: 'kg',
        completed: false,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    } else if (newUser.goalWeightKg > newUser.weightKg) {
      initialData.goals.push({
        id: `g_init_${Date.now()}`,
        title: `Alcançar ${newUser.goalWeightKg}kg (Hipertrofia)`,
        category: 'peso',
        direction: 'up',
        startValue: newUser.weightKg,
        currentValue: newUser.weightKg,
        targetValue: newUser.goalWeightKg,
        unit: 'kg',
        completed: false,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
    storage.saveUserData(newUser.uid, initialData);

    return { ok: true, user: newUser };
  },

  startSessionForUser(uid) {
    const user = storage.getUserByUid(uid);
    if (!user) return false;
    storage.saveSession({
      activeUid: user.uid,
      impersonatorUid: null,
      loggedInAt: new Date().toISOString(),
    });
    return true;
  },

  impersonate(targetUid) {
    const current = this.getActiveUser();
    const session = this.getSession();
    const adminUid = session?.impersonatorUid || (current?.role === 'admin' ? current.uid : null);

    if (!adminUid) {
      return { ok: false, error: 'Apenas Admin Master pode usar o modo Impersonate.' };
    }

    const target = storage.getUserByUid(targetUid);
    if (!target) {
      return { ok: false, error: 'Usuário não encontrado.' };
    }

    if (target.uid === adminUid) {
      return this.exitImpersonation();
    }

    storage.saveSession({
      activeUid: target.uid,
      impersonatorUid: adminUid,
      impersonatedAt: new Date().toISOString(),
    });

    storage.getUserData(target.uid, target);
    return { ok: true, user: target };
  },

  exitImpersonation() {
    const session = this.getSession();
    if (!session?.impersonatorUid) return { ok: false };
    const admin = storage.getUserByUid(session.impersonatorUid);
    if (!admin) return { ok: false };

    storage.saveSession({
      activeUid: admin.uid,
      impersonatorUid: null,
      loggedInAt: new Date().toISOString(),
    });

    return { ok: true, user: admin };
  },

  logout() {
    storage.saveSession(null);
  },
};
