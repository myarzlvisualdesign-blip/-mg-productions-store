-- Generated from db/custom.db
-- Import this file in Supabase SQL Editor

delete from "Category";
insert into "Category" ("id", "name", "order", "active", "createdAt", "updatedAt") values
('cmnes3p2e0000qaux2fs24roq', 'Electronics', 0, true, to_timestamp(1774971332006 / 1000.0), to_timestamp(1774971332006 / 1000.0)),
('cmnes3p2g0001qauxkisfa6a8', 'Bags', 1, true, to_timestamp(1774971332008 / 1000.0), to_timestamp(1774971332008 / 1000.0)),
('cmnes3p2h0002qauxx0gzh8md', 'Accessories', 2, true, to_timestamp(1774971332009 / 1000.0), to_timestamp(1774971332009 / 1000.0)),
('cmnes3p2h0003qaux8qh9sczz', 'Home', 3, true, to_timestamp(1774971332010 / 1000.0), to_timestamp(1774971332010 / 1000.0)),
('cmnes3p2i0004qauxkspzh8c9', 'Fashion', 4, true, to_timestamp(1774971332011 / 1000.0), to_timestamp(1774971332011 / 1000.0)),
('cmnes3p2j0005qaux2envqc3t', 'Health', 5, true, to_timestamp(1774971332011 / 1000.0), to_timestamp(1774971332011 / 1000.0)),
('cmnes3p2k0006qauxju7bc5cl', 'Photography', 6, true, to_timestamp(1774971332012 / 1000.0), to_timestamp(1774971332012 / 1000.0));

delete from "ChatbotSettings";
insert into "ChatbotSettings" ("id", "name", "avatar", "welcomeMessage", "systemPrompt", "enabled", "createdAt", "updatedAt") values
('cmnes23s30000qangjkssjm07', 'MG Assistant', '', 'Halo! 👋 Saya MG Assistant. Ada yang bisa saya bantu?', 'Kamu adalah MG Assistant, customer service AI dari MG PRODUCTIONS. Kamu ramah, profesional, dan membantu pelanggan dengan informasi tentang produk, layanan top-up, makanan, travel, dan promo. Jawab dalam Bahasa Indonesia yang santai dan mudah dipahami. Jika ditanya hal di luar produk MG PRODUCTIONS, arahkan kembali ke layanan yang tersedia.', true, to_timestamp(1774971257763 / 1000.0), to_timestamp(1774971257763 / 1000.0)),
('cmnes3p2p000cqauxlmmpr6do', 'MG Assistant', '', 'Halo! 👋 Saya MG Assistant. Ada yang bisa saya bantu?', 'Kamu adalah MG Assistant, customer service AI dari MG PRODUCTIONS. Kamu ramah, profesional, dan membantu pelanggan dengan informasi tentang produk, layanan top-up, makanan, travel, dan promo. Jawab dalam Bahasa Indonesia yang santai dan mudah dipahami. Jika ditanya hal di luar produk MG PRODUCTIONS, arahkan kembali ke layanan yang tersedia.', true, to_timestamp(1774971332018 / 1000.0), to_timestamp(1774971332018 / 1000.0));

delete from "FoodItem";
insert into "FoodItem" ("id", "name", "subtitle", "emoji", "color", "image", "items", "link", "order", "active", "createdAt", "updatedAt") values
('cmnes3tsm0006qawb0g3w3yvk', 'Coffee & Drinks', 'Kopi, Teh, Jus & Minuman', '☕', 'from-amber-700 to-amber-500', '', '[{"name":"Es Kopi Susu","price":"Rp 18.000"},{"name":"Matcha Latte","price":"Rp 22.000"},{"name":"Thai Tea","price":"Rp 15.000"},{"name":"Fresh Juice","price":"Rp 20.000"}]', '', 0, true, to_timestamp(1774971338134 / 1000.0), to_timestamp(1774971338134 / 1000.0)),
('cmnes3tsm0007qawbk70m1rxa', 'Rice & Meals', 'Nasi, Mie & Lauk', '🍛', 'from-orange-700 to-orange-500', '', '[{"name":"Nasi Goreng","price":"Rp 25.000"},{"name":"Mie Ayam","price":"Rp 20.000"},{"name":"Ayam Geprek","price":"Rp 22.000"},{"name":"Soto Betawi","price":"Rp 28.000"}]', '', 1, true, to_timestamp(1774971338134 / 1000.0), to_timestamp(1774971338134 / 1000.0)),
('cmnes3tsm0008qawbk4uoommp', 'Snacks & Pizza', 'Cemilan, Burger & Pizza', '🍕', 'from-red-700 to-red-500', '', '[{"name":"French Fries","price":"Rp 18.000"},{"name":"Burger Classic","price":"Rp 30.000"},{"name":"Pizza Slice","price":"Rp 35.000"},{"name":"Chicken Wings","price":"Rp 28.000"}]', '', 2, true, to_timestamp(1774971338134 / 1000.0), to_timestamp(1774971338134 / 1000.0)),
('cmnes3tsm0009qawbk0z41e9p', 'Desserts', 'Es Krim, Cake & Roti', '🍰', 'from-pink-700 to-pink-500', '', '[{"name":"Ice Cream Cone","price":"Rp 15.000"},{"name":"Chocolate Cake","price":"Rp 35.000"},{"name":"Croissant","price":"Rp 20.000"},{"name":"Pancake","price":"Rp 25.000"}]', '', 3, true, to_timestamp(1774971338134 / 1000.0), to_timestamp(1774971338134 / 1000.0));

delete from "Order";
insert into "Order" ("id", "items", "total", "status", "customerName", "customerEmail", "customerPhone", "address", "createdAt", "updatedAt") values
('cmnes3rc5000cqavqq6ppkwc0', '[{"productId":"1","name":"Wireless Noise-Cancelling Headphones","price":2999000,"quantity":1}]', 2999000, 'delivered', 'Alice Johnson', 'alice@example.com', '+62-812-3456-7890', 'Jl. Sudirman No. 123, Jakarta Selatan', to_timestamp(1774971334949 / 1000.0), to_timestamp(1774971334949 / 1000.0)),
('cmnes3rc5000dqavqzk11nz3o', '[{"productId":"2","name":"Smart Watch Pro","price":4499000,"quantity":1},{"productId":"7","name":"Wireless Charging Dock","price":899000,"quantity":1}]', 5398000, 'shipped', 'Bob Smith', 'bob@example.com', '+62-813-4567-8901', 'Jl. Gatot Subroto No. 456, Jakarta Pusat', to_timestamp(1774971334950 / 1000.0), to_timestamp(1774971334950 / 1000.0)),
('cmnes3rc6000eqavqgziv9kfi', '[{"productId":"5","name":"Premium Mechanical Keyboard","price":1599000,"quantity":2}]', 3198000, 'processing', 'Carol Davis', 'carol@example.com', NULL, 'Jl. Thamrin No. 789, Jakarta Pusat', to_timestamp(1774971334950 / 1000.0), to_timestamp(1774971334950 / 1000.0)),
('cmnes3rc6000fqavqv0aqd8rq', '[{"productId":"3","name":"Minimalist Leather Backpack","price":1899000,"quantity":1},{"productId":"8","name":"Designer Sunglasses","price":2199000,"quantity":1},{"productId":"10","name":"Premium Yoga Mat","price":989000,"quantity":1}]', 5087000, 'pending', 'David Wilson', 'david@example.com', '+62-814-5678-9012', 'Jl. Kemang Raya No. 321, Jakarta Selatan', to_timestamp(1774971334951 / 1000.0), to_timestamp(1774971334951 / 1000.0)),
('cmnes3rc7000gqavq66koodnf', '[{"productId":"11","name":"Vintage Film Camera","price":3499000,"quantity":1}]', 3499000, 'delivered', 'Emma Brown', 'emma@example.com', NULL, 'Jl. Senopati No. 654, Jakarta Selatan', to_timestamp(1774971334951 / 1000.0), to_timestamp(1774971334951 / 1000.0)),
('cmnes3rc7000hqavqcvb8m3sc', '[{"productId":"9","name":"Portable Bluetooth Speaker","price":1299000,"quantity":3},{"productId":"12","name":"Aromatherapy Diffuser Set","price":549000,"quantity":2}]', 4995000, 'shipped', 'Frank Garcia', 'frank@example.com', '+62-815-6789-0123', 'Jl. Rasuna Said No. 987, Jakarta Selatan', to_timestamp(1774971334952 / 1000.0), to_timestamp(1774971334952 / 1000.0)),
('cmnes3rc8000iqavqabtjazh6', '[{"productId":"6","name":"Artisan Ceramic Pour-Over Set","price":649000,"quantity":1}]', 649000, 'cancelled', 'Grace Lee', 'grace@example.com', NULL, 'Jl. Casablanca No. 147, Jakarta Selatan', to_timestamp(1774971334952 / 1000.0), to_timestamp(1774971334952 / 1000.0)),
('cmnes3rc8000jqavq9dtyqtef', '[{"productId":"4","name":"Ultra-Slim Laptop Stand","price":799000,"quantity":1},{"productId":"5","name":"Premium Mechanical Keyboard","price":1599000,"quantity":1},{"productId":"7","name":"Wireless Charging Dock","price":899000,"quantity":1}]', 3297000, 'delivered', 'Henry Martinez', 'henry@example.com', '+62-816-7890-1234', 'Jl. MT Haryono No. 258, Jakarta Timur', to_timestamp(1774971334953 / 1000.0), to_timestamp(1774971334953 / 1000.0));

delete from "Partner";
insert into "Partner" ("id", "name", "description", "image", "link", "order", "active", "createdAt", "updatedAt") values
('cmnes3p2l0007qaux0ju7kj4o', 'MG Design Studio', 'Premium UI/UX Design Agency', '/uploads/partners/partner-design.jpeg', '', 0, true, to_timestamp(1774971332013 / 1000.0), to_timestamp(1774971332013 / 1000.0)),
('cmnes3p2m0008qauxee8dxkix', 'TechVenture', 'Gadget & Electronics Reseller', '/uploads/partners/partner-tech.jpeg', '', 1, true, to_timestamp(1774971332014 / 1000.0), to_timestamp(1774971332014 / 1000.0)),
('cmnes3p2n0009qauxye4mr2rw', 'StyleHub', 'Fashion & Lifestyle Brand', '/uploads/partners/partner-fashion.jpeg', '', 2, true, to_timestamp(1774971332015 / 1000.0), to_timestamp(1774971332015 / 1000.0)),
('cmnes3p2o000aqauxdf6ijsfl', 'HomeDecor ID', 'Modern Home Furnishing', '/uploads/partners/partner-home.jpeg', '', 3, true, to_timestamp(1774971332016 / 1000.0), to_timestamp(1774971332016 / 1000.0)),
('cmnes3p2o000bqaux4708cr4q', 'ElectroMart', 'Electronic Components Store', '/uploads/partners/partner-electronics.jpeg', '', 4, true, to_timestamp(1774971332017 / 1000.0), to_timestamp(1774971332017 / 1000.0));

delete from "PopularDestination";
insert into "PopularDestination" ("id", "name", "subtitle", "emoji", "color", "image", "order", "active", "createdAt", "updatedAt") values
('cmnes3tuv0000qawrgaad6o45', 'Bali', 'Pantai, Budaya & Kuliner', '🏖️', 'from-teal-600 to-cyan-400', '/uploads/destinations/bali.png', 0, true, to_timestamp(1774971338215 / 1000.0), to_timestamp(1775073340268 / 1000.0)),
('cmnes3tuv0001qawrxcuzy6mv', 'Raja Ampat', 'Diving & Snorkeling', '🐠', 'from-blue-600 to-sky-400', '/uploads/destinations/raja-ampat.png', 1, true, to_timestamp(1774971338216 / 1000.0), to_timestamp(1774971338216 / 1000.0)),
('cmnes3tuw0002qawr0lzncrs2', 'Labuan Bajo', 'Komodo & Pink Beach', '🦎', 'from-emerald-600 to-green-400', '/uploads/destinations/labuan-bajo.png', 2, true, to_timestamp(1774971338216 / 1000.0), to_timestamp(1774971338216 / 1000.0)),
('cmnes3tuw0003qawrukhbua8o', 'Yogyakarta', 'Candi & Heritage', '🏛️', 'from-amber-600 to-yellow-400', '/uploads/destinations/yogyakarta.png', 3, true, to_timestamp(1774971338217 / 1000.0), to_timestamp(1774971338217 / 1000.0)),
('cmnes3tux0004qawr6llmw70x', 'Lombok', 'Pantai & Gunung Rinjani', '🏔️', 'from-violet-600 to-purple-400', '/uploads/destinations/lombok.png', 4, true, to_timestamp(1774971338218 / 1000.0), to_timestamp(1774971338218 / 1000.0)),
('cmnes3tux0005qawrq4cj2ue4', 'Bandung', 'Wisata Alam & Kuliner', '🌸', 'from-pink-600 to-rose-400', '/uploads/destinations/bandung.png', 5, true, to_timestamp(1774971338218 / 1000.0), to_timestamp(1774971338218 / 1000.0));

delete from "Product";
insert into "Product" ("id", "name", "description", "price", "image", "category", "link", "stock", "featured", "rating", "createdAt", "updatedAt") values
('cmnes3rby0000qavqjbicxn3n', 'Wireless Noise-Cancelling Headphones', 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and immersive spatial audio. Perfect for audiophiles and professionals.', 2999000, '/api/images/products/headphones.jpg', 'Electronics', '', 45, true, 4.8, to_timestamp(1774971334942 / 1000.0), to_timestamp(1774971334942 / 1000.0)),
('cmnes3rbz0001qavqkuahv430', 'Smart Watch Pro', 'Advanced fitness tracking with ECG monitoring, GPS, and a stunning AMOLED display. Water-resistant to 50 meters.', 4499000, '/api/images/products/smartwatch.jpg', 'Electronics', '', 32, true, 4.6, to_timestamp(1774971334943 / 1000.0), to_timestamp(1774971334943 / 1000.0)),
('cmnes3rbz0002qavqag5w1t2v', 'Minimalist Leather Backpack', 'Handcrafted Italian leather backpack with padded laptop compartment, RFID-blocking pocket, and water-resistant coating.', 1899000, '/api/images/products/backpack.jpg', 'Bags', '', 28, true, 4.9, to_timestamp(1774971334944 / 1000.0), to_timestamp(1774971334944 / 1000.0)),
('cmnes3rc00003qavq28zl3778', 'Ultra-Slim Laptop Stand', 'Ergonomic aluminum laptop stand with adjustable height, cable management, and non-slip silicone pads. Compatible with all laptops up to 17 inches.', 799000, '/api/images/products/laptop-stand.jpg', 'Accessories', '', 120, false, 4.5, to_timestamp(1774971334944 / 1000.0), to_timestamp(1774971334944 / 1000.0)),
('cmnes3rc00004qavqcj6kkabo', 'Premium Mechanical Keyboard', 'Hot-swappable mechanical keyboard with RGB lighting, gasket-mount design, and premium PBT keycaps. Features a compact 75% layout.', 1599000, '/api/images/products/keyboard.jpg', 'Electronics', '', 67, true, 4.7, to_timestamp(1774971334945 / 1000.0), to_timestamp(1774971334945 / 1000.0)),
('cmnes3rc10005qavqwahfrus3', 'Artisan Ceramic Pour-Over Set', 'Handmade ceramic coffee dripper with double-wall thermal carafe and reusable stainless steel filter. Brews 4 cups of perfect coffee.', 649000, '/api/images/products/pour-over.jpg', 'Home', '', 85, false, 4.4, to_timestamp(1774971334945 / 1000.0), to_timestamp(1774971334945 / 1000.0)),
('cmnes3rc10006qavq29ounmzj', 'Wireless Charging Dock', '3-in-1 wireless charging station for phone, watch, and earbuds. Features 15W fast charging and elegant marble finish.', 899000, '/api/images/products/charger.jpg', 'Accessories', '', 54, false, 4.3, to_timestamp(1774971334946 / 1000.0), to_timestamp(1774971334946 / 1000.0)),
('cmnes3rc20007qavqq015a0n0', 'Designer Sunglasses', 'Polarized titanium-frame sunglasses with anti-reflective coating. UV400 protection with a timeless aviator design.', 2199000, '/api/images/products/sunglasses.jpg', 'Fashion', '', 40, true, 4.6, to_timestamp(1774971334946 / 1000.0), to_timestamp(1774971334946 / 1000.0)),
('cmnes3rc20008qavqjic3oi49', 'Portable Bluetooth Speaker', 'Waterproof 360-degree sound speaker with 20-hour battery, deep bass, and multi-speaker pairing capability.', 1299000, '/api/images/products/speaker.jpg', 'Electronics', '', 73, false, 4.5, to_timestamp(1774971334947 / 1000.0), to_timestamp(1774971334947 / 1000.0)),
('cmnes3rc30009qavqdbv2lnk7', 'Premium Yoga Mat', 'Extra-thick natural rubber yoga mat with alignment lines, non-slip texture, and carrying strap. Eco-friendly and sustainable.', 989000, '/api/images/products/yoga-mat.jpg', 'Health', '', 95, false, 4.7, to_timestamp(1774971334947 / 1000.0), to_timestamp(1774971334947 / 1000.0)),
('cmnes3rc3000aqavqw9tyz7fg', 'Vintage Film Camera', 'Restored classic 35mm film camera with built-in light meter, leather body wrap, and carrying case. A timeless photography tool.', 3499000, '/api/images/products/camera.jpg', 'Photography', '', 15, true, 4.9, to_timestamp(1774971334948 / 1000.0), to_timestamp(1774971334948 / 1000.0)),
('cmnes3rc4000bqavqb0k0ssxc', 'Aromatherapy Diffuser Set', 'Ultrasonic essential oil diffuser with 7 LED mood lights, auto shut-off, and a curated set of 6 organic essential oils.', 549000, '/api/images/products/diffuser.jpg', 'Home', '', 110, false, 4.2, to_timestamp(1774971334948 / 1000.0), to_timestamp(1774971334948 / 1000.0));

delete from "ReferralCode";
insert into "ReferralCode" ("id", "code", "ownerName", "ownerEmail", "totalUsed", "totalReward", "totalWithdrawn", "active", "createdAt", "updatedAt") values
('cmnf0ly3l0000qa3g6op2gksh', 'MG-T9LZRX', 'yoi', 'tesdulu16@gmail.com', 0, 0, 0, true, to_timestamp(1774985620450 / 1000.0), to_timestamp(1774985620450 / 1000.0));

delete from "ReferralSettings";
insert into "ReferralSettings" ("id", "enabled", "referrerReward", "refereeReward", "minOrderAmount", "minWithdraw", "createdAt", "updatedAt") values
('cmnes3p2q000dqaux3onaykv1', true, 50000, 25000, 100000, 100000, to_timestamp(1774971332019 / 1000.0), to_timestamp(1774971332019 / 1000.0));

-- ReferralUse: no rows

-- ReferralWithdrawal: no rows

delete from "TopUpBanner";
insert into "TopUpBanner" ("id", "title", "subtitle", "badge", "image", "link", "color", "order", "active", "createdAt", "updatedAt") values
('cmnes3tx40000qax7a6e89ok3', 'Flash Sale Diamond', 'Diskon hingga 30% untuk semua game favorit!', '🔥 FLASH SALE', '/uploads/topup-banners/promo-diamond.png', '', 'from-purple-600 to-blue-500', 0, true, to_timestamp(1774971338296 / 1000.0), to_timestamp(1774971338296 / 1000.0)),
('cmnes3tx50001qax7h2stvxxp', 'Weekly Pass Special', 'Beli pass mingguan & dapatkan bonus eksklusif setiap hari', '✨ PROMO', '/uploads/topup-banners/promo-weekly.png', '', 'from-amber-600 to-orange-500', 1, true, to_timestamp(1774971338297 / 1000.0), to_timestamp(1774971338297 / 1000.0)),
('cmnes3tx50002qax746v4smoc', 'Top Up E-Wallet', 'GoPay, OVO, DANA, ShopeePay — proses instan tanpa ribet', '💰 CASHBACK', '/uploads/topup-banners/promo-ewallet.png', '', 'from-emerald-600 to-teal-500', 2, true, to_timestamp(1774971338298 / 1000.0), to_timestamp(1774971338298 / 1000.0));

delete from "TopUpService";
insert into "TopUpService" ("id", "name", "subtitle", "emoji", "color", "image", "items", "link", "order", "active", "createdAt", "updatedAt") values
('cmnes3tsk0000qawbqbslqlnd', 'Mobile Legends', 'Diamonds & Weekly Pass', '🎮', 'from-blue-600 to-blue-400', '', '["86 Diamonds","172 Diamonds","257 Diamonds","Starlight Member"]', '', 0, true, to_timestamp(1774971338132 / 1000.0), to_timestamp(1774971338132 / 1000.0)),
('cmnes3tsk0001qawbhf956o9m', 'Free Fire', 'Diamonds & Membership', '🔥', 'from-orange-600 to-amber-400', '', '["100 Diamonds","310 Diamonds","520 Diamonds","Membro Elite"]', '', 1, true, to_timestamp(1774971338132 / 1000.0), to_timestamp(1774971338132 / 1000.0)),
('cmnes3tsk0002qawbwff5w59r', 'PUBG Mobile', 'UC & Royale Pass', '🎯', 'from-amber-600 to-yellow-400', '', '["60 UC","325 UC","660 UC","Royale Pass"]', '', 2, true, to_timestamp(1774971338132 / 1000.0), to_timestamp(1774971338132 / 1000.0)),
('cmnes3tsk0003qawb6uchjqol', 'Genshin Impact', 'Genesis Crystals', '✨', 'from-violet-600 to-purple-400', '', '["60 Genesis","300+30 Genesis","980+110 Genesis","Blessing Bundle"]', '', 3, true, to_timestamp(1774971338132 / 1000.0), to_timestamp(1774971338132 / 1000.0)),
('cmnes3tsk0004qawbfj8golhv', 'Valorant', 'Valorant Points', '🔫', 'from-red-600 to-rose-400', '', '["125 VP","420 VP","700 VP","2450 VP"]', '', 4, true, to_timestamp(1774971338132 / 1000.0), to_timestamp(1774971338132 / 1000.0)),
('cmnes3tsk0005qawbhtfaiv31', 'E-Wallet & Pulsa', 'GoPay, OVO, Dana & Pulsa', '💳', 'from-emerald-600 to-teal-400', '', '["GoPay","OVO","Dana","Pulsa All Operator"]', '', 5, true, to_timestamp(1774971338132 / 1000.0), to_timestamp(1774971338132 / 1000.0));

delete from "TravelService";
insert into "TravelService" ("id", "name", "subtitle", "emoji", "color", "image", "desc", "link", "order", "active", "createdAt", "updatedAt") values
('cmnes3tsm000aqawbusdzary8', 'Tiket Pesawat', 'Domestik & Internasional', '✈️', 'from-sky-600 to-blue-400', '', 'Penerbangan terbaik dengan harga bersaing', '', 0, true, to_timestamp(1774971338135 / 1000.0), to_timestamp(1774971338135 / 1000.0)),
('cmnes3tsm000bqawbdj945nxl', 'Hotel & Villa', 'Akomodasi Bintang 1–5', '🏨', 'from-violet-600 to-purple-400', '', 'Penginapan nyaman di seluruh Indonesia', '', 1, true, to_timestamp(1774971338135 / 1000.0), to_timestamp(1774971338135 / 1000.0)),
('cmnes3tsm000cqawb6zp0oooo', 'Wisata & Tour', 'Paket Trip & Open Trip', '🌴', 'from-emerald-600 to-teal-400', '', 'Destinasi populer: Bali, Raja Ampat, Labuan Bajo', '', 2, true, to_timestamp(1774971338135 / 1000.0), to_timestamp(1774971338135 / 1000.0)),
('cmnes3tsm000dqawbn6obws19', 'Tiket Kereta', 'KAI & KRL Jabodetabek', '🚆', 'from-amber-600 to-yellow-400', '', 'Perjalanan darat yang mudah dan cepat', '', 3, true, to_timestamp(1774971338135 / 1000.0), to_timestamp(1774971338135 / 1000.0)),
('cmnes3tsm000eqawbtkeumrru', 'Kapal Laut & Ferry', 'Penyeberangan & Cruise', '🚢', 'from-cyan-600 to-sky-400', '', 'Rute antar pulau terjangkau', '', 4, true, to_timestamp(1774971338135 / 1000.0), to_timestamp(1774971338135 / 1000.0)),
('cmnes3tsm000fqawbvss1umjd', 'Rental & Transport', 'Mobil, Motor & Bus', '🚗', 'from-rose-600 to-pink-400', '', 'Sewa kendaraan dengan atau tanpa supir', '', 5, true, to_timestamp(1774971338135 / 1000.0), to_timestamp(1774971338135 / 1000.0));
