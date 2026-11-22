/**
 * Piff Paff Gym — Modular Entitlements / Future VIP Gate
 * 100% GRATUITO no lançamento: todas as features retornam allowed = true.
 * Estrutura pronta para ligar planos VIP no futuro sem alterar telas.
 */

import { APP_CONFIG } from '../config.js';

export const FEATURES = {
  PRO_MATRICES: 'pro_matrices',
  PRO_TECHNIQUES: 'pro_techniques_fst7',
  CUSTOM_WORKOUT_BUILDER: 'custom_workout_builder',
  UNLIMITED_PHOTOS: 'unlimited_photos',
  STORY_CARD_EXPORT: 'story_card_export',
  ADVANCED_CHARTS: 'advanced_charts',
  SPOTIFY_CUSTOM_LINK: 'spotify_custom_link',
  ADMIN_CRM: 'admin_crm',
};

const FUTURE_VIP_FEATURES = new Set([
  FEATURES.PRO_TECHNIQUES,
  FEATURES.UNLIMITED_PHOTOS,
  FEATURES.STORY_CARD_EXPORT,
]);

export function canAccessFeature(user, featureKey) {
  // Admin Master sempre tem acesso total
  if (user?.role === 'admin') {
    return { allowed: true, reason: 'admin_master' };
  }

  // Admin CRM é sempre exclusivo do Admin Master
  if (featureKey === FEATURES.ADMIN_CRM) {
    return { allowed: false, reason: 'admin_only' };
  }

  // Lançamento 100% Gratuito: nenhum paywall ativo
  if (!APP_CONFIG.MONETIZATION.BILLING_ENABLED) {
    return { allowed: true, reason: 'free_launch_all_access' };
  }

  // Regra futura quando BILLING_ENABLED === true
  if (FUTURE_VIP_FEATURES.has(featureKey)) {
    const isVip = user?.tier === 'vip_pro';
    return {
      allowed: isVip,
      reason: isVip ? 'vip_pro_active' : 'requires_vip_pro',
    };
  }

  return { allowed: true, reason: 'free_tier' };
}

export function getUserPlanBadge(user) {
  if (user?.role === 'admin') {
    return { label: 'ADMIN MASTER', tone: 'gold' };
  }
  if (!APP_CONFIG.MONETIZATION.BILLING_ENABLED) {
    return { label: 'ACESSO TOTAL GRATUITO', tone: 'emerald' };
  }
  if (user?.tier === 'vip_pro') {
    return { label: 'VIP PRO', tone: 'gold' };
  }
  return { label: 'GRATUITO', tone: 'neutral' };
}
