'use client'

import { useState } from 'react'
import { Github, Twitter, Instagram, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const socialLinks = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  return (
    <footer id="contact" className="mt-auto">
      {/* Top Border */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-sm.png"
                alt="MG PRODUCTIONS"
                className="h-8 w-auto object-contain rounded-md"
              />
              <span className="text-xl font-bold gradient-text">MG PRODUCTIONS</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your destination for premium products for the modern lifestyle.
              At competitive prices, discover quality, elegance, and innovation in every item.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center w-9 h-9 rounded-lg glass-card border border-white/5 text-muted-foreground hover:text-purple-400 hover:border-purple-500/30 transition-colors"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Newsletter
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Stay updated with our latest products and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="h-10 border-white/10 bg-white/5 text-sm pr-10"
                />
                <Send className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              </div>
              <Button
                type="submit"
                size="sm"
                className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-lg"
              >
                {subscribed ? 'Done!' : 'Join'}
              </Button>
            </form>
            {subscribed && (
              <p className="text-xs text-green-400">Thanks for subscribing!</p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator className="my-10 bg-white/5" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MG PRODUCTIONS. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Crafted with premium quality in mind.
          </p>
        </div>
      </div>
    </footer>
  )
}
