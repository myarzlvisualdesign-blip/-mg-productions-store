import { db } from '../src/lib/db'

async function seed() {
  console.log('Seeding TopUpService...')
  await db.topUpService.createMany({
    data: [
      { name: "Mobile Legends", subtitle: "Diamonds & Weekly Pass", emoji: "🎮", color: "from-blue-600 to-blue-400", items: '["86 Diamonds","172 Diamonds","257 Diamonds","Starlight Member"]', order: 0 },
      { name: "Free Fire", subtitle: "Diamonds & Membership", emoji: "🔥", color: "from-orange-600 to-amber-400", items: '["100 Diamonds","310 Diamonds","520 Diamonds","Membro Elite"]', order: 1 },
      { name: "PUBG Mobile", subtitle: "UC & Royale Pass", emoji: "🎯", color: "from-amber-600 to-yellow-400", items: '["60 UC","325 UC","660 UC","Royale Pass"]', order: 2 },
      { name: "Genshin Impact", subtitle: "Genesis Crystals", emoji: "✨", color: "from-violet-600 to-purple-400", items: '["60 Genesis","300+30 Genesis","980+110 Genesis","Blessing Bundle"]', order: 3 },
      { name: "Valorant", subtitle: "Valorant Points", emoji: "🔫", color: "from-red-600 to-rose-400", items: '["125 VP","420 VP","700 VP","2450 VP"]', order: 4 },
      { name: "E-Wallet & Pulsa", subtitle: "GoPay, OVO, Dana & Pulsa", emoji: "💳", color: "from-emerald-600 to-teal-400", items: '["GoPay","OVO","Dana","Pulsa All Operator"]', order: 5 },
    ],
  })

  console.log('Seeding FoodItem...')
  await db.foodItem.createMany({
    data: [
      { name: "Coffee & Drinks", subtitle: "Kopi, Teh, Jus & Minuman", emoji: "☕", color: "from-amber-700 to-amber-500", items: '[{"name":"Es Kopi Susu","price":"Rp 18.000"},{"name":"Matcha Latte","price":"Rp 22.000"},{"name":"Thai Tea","price":"Rp 15.000"},{"name":"Fresh Juice","price":"Rp 20.000"}]', order: 0 },
      { name: "Rice & Meals", subtitle: "Nasi, Mie & Lauk", emoji: "🍛", color: "from-orange-700 to-orange-500", items: '[{"name":"Nasi Goreng","price":"Rp 25.000"},{"name":"Mie Ayam","price":"Rp 20.000"},{"name":"Ayam Geprek","price":"Rp 22.000"},{"name":"Soto Betawi","price":"Rp 28.000"}]', order: 1 },
      { name: "Snacks & Pizza", subtitle: "Cemilan, Burger & Pizza", emoji: "🍕", color: "from-red-700 to-red-500", items: '[{"name":"French Fries","price":"Rp 18.000"},{"name":"Burger Classic","price":"Rp 30.000"},{"name":"Pizza Slice","price":"Rp 35.000"},{"name":"Chicken Wings","price":"Rp 28.000"}]', order: 2 },
      { name: "Desserts", subtitle: "Es Krim, Cake & Roti", emoji: "🍰", color: "from-pink-700 to-pink-500", items: '[{"name":"Ice Cream Cone","price":"Rp 15.000"},{"name":"Chocolate Cake","price":"Rp 35.000"},{"name":"Croissant","price":"Rp 20.000"},{"name":"Pancake","price":"Rp 25.000"}]', order: 3 },
    ],
  })

  console.log('Seeding TravelService...')
  await db.travelService.createMany({
    data: [
      { name: "Tiket Pesawat", subtitle: "Domestik & Internasional", emoji: "✈️", color: "from-sky-600 to-blue-400", desc: "Penerbangan terbaik dengan harga bersaing", order: 0 },
      { name: "Hotel & Villa", subtitle: "Akomodasi Bintang 1–5", emoji: "🏨", color: "from-violet-600 to-purple-400", desc: "Penginapan nyaman di seluruh Indonesia", order: 1 },
      { name: "Wisata & Tour", subtitle: "Paket Trip & Open Trip", emoji: "🌴", color: "from-emerald-600 to-teal-400", desc: "Destinasi populer: Bali, Raja Ampat, Labuan Bajo", order: 2 },
      { name: "Tiket Kereta", subtitle: "KAI & KRL Jabodetabek", emoji: "🚆", color: "from-amber-600 to-yellow-400", desc: "Perjalanan darat yang mudah dan cepat", order: 3 },
      { name: "Kapal Laut & Ferry", subtitle: "Penyeberangan & Cruise", emoji: "🚢", color: "from-cyan-600 to-sky-400", desc: "Rute antar pulau terjangkau", order: 4 },
      { name: "Rental & Transport", subtitle: "Mobil, Motor & Bus", emoji: "🚗", color: "from-rose-600 to-pink-400", desc: "Sewa kendaraan dengan atau tanpa supir", order: 5 },
    ],
  })

  console.log('Done! Seeded all services.')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
