import { useSite, waHref } from '../site'

// Brand icons (simple paths) for the social links set in the admin (Location & contact).
export const PATHS = {
  facebook: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z',
  whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z',
  youtube: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9L15.2 12l-5.4 3.1z',
  linkedin: 'M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5z',
  instagram: 'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM21.9 7.3c-.1-1.6-.4-3-1.6-4.2S17.7 1.6 16.1 1.5C14.5 1.4 9.5 1.4 7.9 1.5 6.3 1.6 4.9 1.9 3.7 3.1S2.2 5.7 2.1 7.3C2 8.9 2 15.1 2.1 16.7c.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6.6.1 8.2 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-7.8 0-9.4zM19.8 18.6a3.2 3.2 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.7.4s-4.4.1-5.7-.4a3.2 3.2 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.6s-.1-4.4.4-5.6a3.2 3.2 0 0 1 1.8-1.8c1.3-.5 4.3-.4 5.7-.4s4.4-.1 5.7.4a3.2 3.2 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.6s.1 4.4-.4 5.6z',
  tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 5 5.7V9.1a7.4 7.4 0 0 0 4.4 1.4V7.4a4.3 4.3 0 0 1-3.4-1.6z',
}
const NAMES = { facebook: 'Facebook', whatsapp: 'WhatsApp', youtube: 'YouTube', linkedin: 'LinkedIn', instagram: 'Instagram', tiktok: 'TikTok' }
const COLORS = { facebook: 'bg-[#1877f2]', whatsapp: 'bg-[#25d366]', youtube: 'bg-[#ff0000]', linkedin: 'bg-[#0a66c2]', instagram: 'bg-[#e1306c]', tiktok: 'bg-black' }

export function socialLinks(c) {
  return [
    c.facebook && ['facebook', c.facebook],
    c.whatsapp && ['whatsapp', waHref(c.whatsapp)],
    c.youtube && ['youtube', c.youtube],
    c.instagram && ['instagram', c.instagram],
    c.tiktok && ['tiktok', c.tiktok],
    c.linkedin && ['linkedin', c.linkedin],
  ].filter(Boolean)
}

// size: "sm" (top bar) or "lg" (footer, round coloured badges)
export default function Social({ size = 'sm', className = '' }) {
  const { contact } = useSite()
  const links = socialLinks(contact)
  if (!links.length) return null
  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {links.map(([k, href]) => (
        <li key={k}>
          <a href={href} target="_blank" rel="noreferrer" aria-label={NAMES[k]} title={NAMES[k]}
            className={size === 'lg'
              ? `grid h-10 w-10 place-items-center rounded-full ${COLORS[k]} text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-110`
              : `grid h-6 w-6 place-items-center rounded ${COLORS[k]} text-white transition hover:brightness-110`}>
            <svg viewBox="0 0 24 24" className={size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'} fill="currentColor" aria-hidden="true"><path d={PATHS[k]} /></svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
