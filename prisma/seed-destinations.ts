import { db } from '../src/lib/db'

async function seed() {
  console.log('Seeding Popular Destinations...')

  await db.popularDestination.deleteMany()

  const destinations = [
    { name: 'Bali', subtitle: 'Pantai, Budaya & Kuliner', emoji: '🏖️', color: 'from-teal-600 to-cyan-400', image: '/uploads/destinations/bali.png', order: 0 },
    { name: 'Raja Ampat', subtitle: 'Diving & Snorkeling', emoji: '🐠', color: 'from-blue-600 to-sky-400', image: '/uploads/destinations/raja-ampat.png', order: 1 },
    { name: 'Labuan Bajo', subtitle: 'Komodo & Pink Beach', emoji: '🦎', color: 'from-emerald-600 to-green-400', image: '/uploads/destinations/labuan-bajo.png', order: 2 },
    { name: 'Yogyakarta', subtitle: 'Candi & Heritage', emoji: '🏛️', color: 'from-amber-600 to-yellow-400', image: '/uploads/destinations/yogyakarta.png', order: 3 },
    { name: 'Lombok', subtitle: 'Pantai & Gunung Rinjani', emoji: '🏔️', color: 'from-violet-600 to-purple-400', image: '/uploads/destinations/lombok.png', order: 4 },
    { name: 'Bandung', subtitle: 'Wisata Alam & Kuliner', emoji: '🌸', color: 'from-pink-600 to-rose-400', image: '/uploads/destinations/bandung.png', order: 5 },
  ]

  for (const d of destinations) {
    await db.popularDestination.create({ data: d })
  }

  console.log(`Seeded ${destinations.length} destinations`)
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0))
