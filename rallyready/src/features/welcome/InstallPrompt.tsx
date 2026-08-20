import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store/uiStore'

/**
 * Offers to install the app, once, and never again.
 *
 * RallyReady is genuinely better installed — full screen, no browser chrome
 * while a drill is running, and on iOS it is the only way notifications and
 * wake lock behave. But an install prompt that reappears is the single fastest
 * way to make somebody close a tab, so this asks once, takes no for an answer
 * permanently, and does not block anything.
 *
 * `beforeinstallprompt` is Chromium-only. Where it does not fire — Safari, an
 * already-installed app — nothing renders at all, which is the correct
 * behaviour rather than a fallback worth writing.
 */

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const dismissed = useUiStore((state) => state.installPromptDismissed)
  const dismiss = useUiStore((state) => state.dismissInstallPrompt)
  const [event, setEvent] = useState<InstallEvent | null>(null)

  useEffect(() => {
    if (dismissed) return
    const handler = (raw: Event) => {
      // Stop the browser showing its own banner; this one is better placed.
      raw.preventDefault()
      setEvent(raw as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  if (dismissed || !event) return null

  const install = async () => {
    try {
      await event.prompt()
      await event.userChoice
    } catch {
      /* The browser refused or the user closed it; either way we are done. */
    }
    dismiss()
    setEvent(null)
  }

  return (
    <div className="border-border bg-secondary/40 mt-6 flex items-center gap-3 rounded-xl border p-3">
      <Download className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <p className="text-muted-foreground min-w-0 flex-1 text-xs leading-relaxed">
        <span className="text-foreground font-medium">Add it to your home screen</span> — it runs
        full screen and works with no connection.
      </p>
      <Button size="sm" variant="outline" className="shrink-0" onClick={() => void install()}>
        Install
      </Button>
      <Button size="icon-sm" variant="ghost" className="shrink-0" onClick={dismiss} title="Not now">
        <X />
        <span className="sr-only">Do not offer again</span>
      </Button>
    </div>
  )
}
