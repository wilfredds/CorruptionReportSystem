import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Link, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { DataProvider } from '@/lib/data/DataProvider'
import { DesignSystemPage } from '@/features/design-system/DesignSystemPage'
import { LibraryPage, ProgramsPage, ProgressPage } from '@/features/placeholders/pages'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { DrillRunPage } from '@/features/train/DrillRunPage'
import { DrillSetupPage } from '@/features/train/DrillSetupPage'
import { SessionSummaryPage } from '@/features/train/SessionSummaryPage'
import { TrainPage } from '@/features/train/TrainPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Local storage reads are instant and the app must work offline, so
      // retrying a "failed" query buys nothing but a delay.
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">That route does not exist.</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Train</Link>
      </Button>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <Routes>
          {/* The runner is deliberately outside the shell: nothing competes
              with the board while a drill is running. */}
          <Route path="/run/:slug" element={<DrillRunPage />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<TrainPage />} />
            <Route path="/train/:slug" element={<DrillSetupPage />} />
            <Route path="/session/:id" element={<SessionSummaryPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </DataProvider>
    </QueryClientProvider>
  )
}
