import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/10 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4">
              <img src="/images/logo.png" alt="eOpsprimax" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering African businesses through digital excellence since 2010.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link href="/#curriculum" className="text-muted-foreground hover:text-foreground">Curriculum</Link></li>
              <li><Link href="/#trainers" className="text-muted-foreground hover:text-foreground">Trainers</Link></li>
              <li><Link href="/#packages" className="text-muted-foreground hover:text-foreground">Packages</Link></li>
              <li><Link href="/sponsorship" className="text-muted-foreground hover:text-foreground">Sponsorship</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Phone: +255 123 456 789</li>
              <li>Email: info@executivemasterclass.com</li>
              <li>WhatsApp: +255 123 456 789</li>
              <li>Location: Dar es Salaam, Tanzania</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Office Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Monday - Friday: 8:00 AM - 6:00 PM</li>
              <li>Saturday: 9:00 AM - 2:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Executive Masterclass. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
