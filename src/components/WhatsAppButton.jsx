import { useLocation } from 'react-router-dom'
import { useSite, waHref } from '../site'
import { ADMIN } from '../admin/path'
import { PATHS } from './Social'

// Floating WhatsApp chat button, bottom right on every public page.
// The number is the WhatsApp number in Admin → Settings → Location & contact (falls back to the main phone).
export default function WhatsAppButton() {
  const { contact: c } = useSite()
  const { pathname } = useLocation()
  const number = c.whatsapp || c.phone
  if (!number || pathname.startsWith(ADMIN) || pathname.includes('/invoice')) return null
  const text = encodeURIComponent('Hello Farmora, I would like to make an enquiry.')
  return (
    <a
      href={`${waHref(number)}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25d366] p-3.5 text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#1ebe5b] md:bottom-7 md:right-7 print:hidden"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25d366]/40 [animation-duration:2.5s]" aria-hidden="true" />
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d={PATHS.whatsapp} /></svg>
      <span className="hidden pr-1 text-[14px] font-semibold md:group-hover:inline">Chat with us</span>
    </a>
  )
}
