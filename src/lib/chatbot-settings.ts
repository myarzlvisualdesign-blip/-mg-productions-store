import { type ChatbotSettings } from '@prisma/client'
import { db } from '@/lib/db'

const DEFAULT_CHATBOT_SETTINGS = {
  name: 'MG Assistant',
  avatar: '',
  welcomeMessage: 'Halo! 👋 Saya MG Assistant. Saya bisa bantu soal katalog produk, checkout, pembayaran, pengiriman, promo, referral, top up, food, dan travel.',
  systemPrompt:
    'Kamu adalah MG Assistant, customer service AI dari MG PRODUCTIONS. Kamu fokus membantu pelanggan seputar katalog produk, rekomendasi barang, checkout, pembayaran, pengiriman, promo, referral, layanan top-up, makanan, dan travel. Jawab dalam Bahasa Indonesia yang ramah, jelas, dan ringkas. Jika ditanya di luar layanan MG PRODUCTIONS, arahkan kembali ke topik ecommerce dan layanan toko yang tersedia.',
  enabled: true,
} as const

function normalizeSettings(settings: ChatbotSettings) {
  return {
    name: settings.name.trim() || DEFAULT_CHATBOT_SETTINGS.name,
    avatar: settings.avatar.trim(),
    welcomeMessage:
      settings.welcomeMessage.trim() || DEFAULT_CHATBOT_SETTINGS.welcomeMessage,
    systemPrompt:
      settings.systemPrompt.trim() || DEFAULT_CHATBOT_SETTINGS.systemPrompt,
    enabled: settings.enabled,
  }
}

export async function getCanonicalChatbotSettings() {
  const allSettings = await db.chatbotSettings.findMany({
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  })

  if (allSettings.length === 0) {
    return db.chatbotSettings.create({
      data: { ...DEFAULT_CHATBOT_SETTINGS },
    })
  }

  const [primary, ...duplicates] = allSettings
  const normalized = normalizeSettings(primary)
  const needsNormalization =
    primary.name !== normalized.name ||
    primary.avatar !== normalized.avatar ||
    primary.welcomeMessage !== normalized.welcomeMessage ||
    primary.systemPrompt !== normalized.systemPrompt

  if (!needsNormalization && duplicates.length === 0) {
    return primary
  }

  const canonical = needsNormalization
    ? await db.chatbotSettings.update({
        where: { id: primary.id },
        data: normalized,
      })
    : primary

  if (duplicates.length > 0) {
    await db.chatbotSettings.deleteMany({
      where: {
        id: {
          in: duplicates.map((item) => item.id),
        },
      },
    })
  }

  return canonical
}

export function toPublicChatbotSettings(
  settings: ChatbotSettings,
  options?: { includeSystemPrompt?: boolean }
) {
  const payload: Record<string, unknown> = {
    id: settings.id,
    name: settings.name,
    avatar: settings.avatar,
    welcomeMessage: settings.welcomeMessage,
    enabled: settings.enabled,
  }

  if (options?.includeSystemPrompt) {
    payload.systemPrompt = settings.systemPrompt
  }

  return payload
}
