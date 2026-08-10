import { useQuery } from '@tanstack/react-query'
import { CloudOff, Database, Palette, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { useTheme } from '@/hooks/useTheme'
import { useRepositories } from '@/lib/data/context'
import { isSupabaseConfigured } from '@/lib/data'
import { removeKey, STORAGE_KEYS } from '@/lib/data/local/storage'
import type { ThemePreference } from '@/lib/theme'
import { formatDuration, pluralize } from '@/lib/utils'
import { useDrillConfigStore } from '@/store/drillConfigStore'

export function ProfilePage() {
  const repositories = useRepositories()
  const { preference, setPreference } = useTheme()
  const clearAllConfigs = useDrillConfigStore((state) => state.clearAll)

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', 'recent'],
    queryFn: () => repositories.sessions.listRecent(200),
  })

  const totalSeconds = sessions.reduce((sum, session) => sum + session.durationSec, 0)

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your settings and where your data lives."
        hideThemeToggle
      />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="text-primary size-4" aria-hidden />
              Appearance
            </CardTitle>
            <CardDescription>Follows your system unless you pick one.</CardDescription>
          </CardHeader>
          <CardContent>
            <Segmented
              label="Theme"
              value={preference}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              onChange={(value) => setPreference(value as ThemePreference)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {repositories.backend === 'supabase' ? (
                <Database className="text-primary size-4" aria-hidden />
              ) : (
                <CloudOff className="text-primary size-4" aria-hidden />
              )}
              Your data
            </CardTitle>
            <CardDescription>
              {repositories.backend === 'supabase'
                ? 'Synced to your account.'
                : 'Stored on this device only. Accounts and sync arrive in Phase 2.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground text-xs font-medium">Sessions logged</dt>
                <dd className="tnum text-2xl font-bold">{sessions.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium">Total training time</dt>
                <dd className="tnum text-2xl font-bold">{formatDuration(totalSeconds)}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Backend: {repositories.backend}</Badge>
              <Badge variant="outline">
                Supabase {isSupabaseConfigured() ? 'configured' : 'not configured'}
              </Badge>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                if (!window.confirm('Delete all sessions and saved drill setups on this device?')) {
                  return
                }
                removeKey(STORAGE_KEYS.sessions)
                removeKey(STORAGE_KEYS.metrics)
                clearAllConfigs()
                window.location.reload()
              }}
            >
              <Trash2 />
              Clear local data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing logged yet. <Link className="text-primary underline" to="/">Start a drill</Link>{' '}
                and it will show up here.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {sessions.slice(0, 10).map((session) => (
                  <li key={session.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/session/${session.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {session.drillName ?? 'Custom drill'}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {new Date(session.startedAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {pluralize(session.roundsCompleted, 'round')}
                      </p>
                    </div>
                    <span className="tnum text-muted-foreground shrink-0 text-sm">
                      {formatDuration(session.durationSec)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-xs">
          <Link className="hover:text-foreground underline" to="/design-system">
            Design system
          </Link>
        </p>
      </div>
    </>
  )
}
