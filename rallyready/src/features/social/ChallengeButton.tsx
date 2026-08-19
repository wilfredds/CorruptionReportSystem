import { Check, Copy, Lock, Swords } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  challengeMessage,
  challengeUrl,
  encodeChallenge,
  type Challenge,
} from '@/lib/social/challenge'
import { usePremium } from '@/store/premiumStore'

/**
 * Sending the session you just did to somebody else.
 *
 * Works because the engine has always been seed-deterministic: the same seed
 * replays the same corner order, so "beat my score" is a fair contest rather
 * than a comparison of two different drills. No server involved — the whole
 * challenge fits in a code you can paste into a chat.
 */

interface ChallengeButtonProps {
  challenge: Challenge
  drillName: string
}

export function ChallengeButton({ challenge, drillName }: ChallengeButtonProps) {
  const premium = usePremium()
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!premium.has('send-challenges')) {
    return (
      <Card className="mb-5">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="bg-secondary text-muted-foreground grid size-9 shrink-0 place-items-center rounded-xl">
            <Lock className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Challenge someone to this exact session</p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              Same drill, same settings, same shuttle order. Premium sends them; taking one is
              always free.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2.5">
              <Link to="/premium">See Premium</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const code = encodeChallenge(challenge)
  const url = challengeUrl(window.location.origin, code)
  const message = challengeMessage(challenge, drillName, url)

  const send = async () => {
    setFailed(false)
    // The share sheet is what actually reaches Messenger; the clipboard is the
    // fallback for a desktop browser that has no sheet.
    if (navigator.share) {
      try {
        await navigator.share({ text: message })
        return
      } catch {
        // Cancelled or refused — fall through to copying rather than nagging.
      }
    }
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setFailed(true)
    }
  }

  return (
    <Card className="mb-5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="bg-accent text-accent-foreground grid size-9 shrink-0 place-items-center rounded-xl">
            <Swords className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Challenge someone</p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              They get the identical session — same corner order — and your score to beat.
            </p>
          </div>
        </div>
        <Button variant="outline" className="mt-3 w-full" onClick={() => void send()}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied — paste it to them' : 'Send a challenge'}
        </Button>
        {failed && (
          <p className="text-destructive mt-2 text-xs" role="status">
            Could not copy that. Long-press the code instead:{' '}
            <span className="font-mono">{code}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
