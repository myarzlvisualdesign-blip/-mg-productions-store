import { type ReferralSettings } from '@prisma/client'
import { db } from '@/lib/db'

const DEFAULT_REFERRAL_SETTINGS = {
  enabled: true,
  referrerReward: 50000,
  refereeReward: 25000,
  minOrderAmount: 100000,
  minWithdraw: 100000,
} as const

function normalizeSettings(settings: ReferralSettings) {
  return {
    enabled: settings.enabled,
    referrerReward: Number.isFinite(settings.referrerReward)
      ? settings.referrerReward
      : DEFAULT_REFERRAL_SETTINGS.referrerReward,
    refereeReward: Number.isFinite(settings.refereeReward)
      ? settings.refereeReward
      : DEFAULT_REFERRAL_SETTINGS.refereeReward,
    minOrderAmount: Number.isFinite(settings.minOrderAmount)
      ? settings.minOrderAmount
      : DEFAULT_REFERRAL_SETTINGS.minOrderAmount,
    minWithdraw: Number.isFinite(settings.minWithdraw)
      ? settings.minWithdraw
      : DEFAULT_REFERRAL_SETTINGS.minWithdraw,
  }
}

export async function getCanonicalReferralSettings() {
  const allSettings = await db.referralSettings.findMany({
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  })

  if (allSettings.length === 0) {
    return db.referralSettings.create({
      data: { ...DEFAULT_REFERRAL_SETTINGS },
    })
  }

  const [primary, ...duplicates] = allSettings
  const normalized = normalizeSettings(primary)
  const needsNormalization =
    primary.enabled !== normalized.enabled ||
    primary.referrerReward !== normalized.referrerReward ||
    primary.refereeReward !== normalized.refereeReward ||
    primary.minOrderAmount !== normalized.minOrderAmount ||
    primary.minWithdraw !== normalized.minWithdraw

  if (!needsNormalization && duplicates.length === 0) {
    return primary
  }

  const canonical = needsNormalization
    ? await db.referralSettings.update({
        where: { id: primary.id },
        data: normalized,
      })
    : primary

  if (duplicates.length > 0) {
    await db.referralSettings.deleteMany({
      where: {
        id: {
          in: duplicates.map((item) => item.id),
        },
      },
    })
  }

  return canonical
}

export function toPublicReferralSettings(settings: ReferralSettings) {
  return {
    id: settings.id,
    enabled: settings.enabled,
    referrerReward: settings.referrerReward,
    refereeReward: settings.refereeReward,
    minOrderAmount: settings.minOrderAmount,
    minWithdraw: settings.minWithdraw,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  }
}
