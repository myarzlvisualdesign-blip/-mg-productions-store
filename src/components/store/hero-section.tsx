'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 1.2 + i * 0.1, ease: 'easeOut' as const },
  }),
}

export default function HeroSection() {
  const handleScrollToProducts = () => {
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScrollToFeatured = () => {
    document.querySelector('#featured')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative flex min-h-[calc(100vh-4.5rem)] w-full items-center justify-center overflow-hidden hero-gradient pt-8 sm:min-h-[calc(100vh-5rem)] sm:pt-10"
    >
      {/* Decorative Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/20 blur-[120px] float-animation" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-[100px] float-animation" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-pink-500/10 blur-[110px] float-animation" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-violet-600/10 blur-[90px] float-animation" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-6 flex justify-center sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-white/[0.04] px-4 py-1.5 text-xs text-purple-300 sm:text-sm">
            <Sparkles className="size-4" />
            <span>New Collection 2025</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          <span className="text-foreground">Discover Premium</span>
          <br />
          <span className="gradient-text">Products for You</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg md:text-xl"
        >
          Our selection of luxury products is 100% authentic. Start completing your
          stylish new lifestyle.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScrollToProducts}
            className="group inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:from-purple-500 hover:to-indigo-500 sm:min-w-0"
          >
            Shop Now
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScrollToFeatured}
            className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-white/[0.03] px-8 py-3.5 font-semibold text-purple-300 transition-all duration-300 hover:border-purple-500/50 sm:min-w-0"
          >
            Explore Collection
          </motion.button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={itemVariants}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:mt-16 sm:gap-12"
        >
          {[
            { value: '200+', label: 'Products' },
            { value: '50+', label: 'Brands' },
            { value: 'Free', label: 'Shipping' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={statVariants}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
