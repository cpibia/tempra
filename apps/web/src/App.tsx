import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppShell } from './components/layout/AppShell';
import { getProfile, getSettings, isProfileKnownToExist } from './db/db';
import { applyTheme, readStoredTheme, watchSystemTheme } from './lib/theme';
import { installWakeLockRecovery } from './lib/wake-lock';
import { useRestTimer } from './lib/rest-timer';
import { unlockAudio } from './lib/sound';
import { RestTimerBar } from './features/workout/RestTimerBar';
import { UpdatePrompt } from './components/UpdatePrompt';

const HomePage = lazy(() => import('./features/home/HomePage'));
const OnboardingPage = lazy(() => import('./features/onboarding/OnboardingPage'));
const PlansPage = lazy(() => import('./features/plans/PlansPage'));
const PlanEditorPage = lazy(() => import('./features/plans/PlanEditorPage'));
const GeneratePage = lazy(() => import('./features/plans/GeneratePage'));
const CatalogPage = lazy(() => import('./features/catalog/CatalogPage'));
const ExercisePage = lazy(() => import('./features/catalog/ExercisePage'));
const WorkoutPage = lazy(() => import('./features/workout/WorkoutPage'));
const SessionSummaryPage = lazy(() => import('./features/workout/SessionSummaryPage'));
const ProgressPage = lazy(() => import('./features/progress/ProgressPage'));
const HistoryPage = lazy(() => import('./features/progress/HistoryPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

function Loading() {
  return (
    <p className="muted" style={{ padding: 'calc(var(--spacing) * 8) 0', textAlign: 'center' }}>
      Caricamento...
    </p>
  );
}

/** Rotte a schermo intero: qui la barra di navigazione sparisce. */
const IMMERSIVE = ['/onboarding', '/allenamento'];

export function App() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  // undefined significa "ancora in caricamento", null significa "non esiste".
  // Confondere i due casi rimanda all'onboarding un utente che ha gia' un profilo.
  const profile = useLiveQuery(async () => (await getProfile()) ?? null, [], undefined);
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const restore = useRestTimer((s) => s.restore);
  const setTimerPrefs = useRestTimer((s) => s.setPreferences);

  useEffect(() => {
    applyTheme(readStoredTheme());
    const stopWatching = watchSystemTheme(() => applyTheme(readStoredTheme()));
    const stopWakeLock = installWakeLockRecovery();
    restore();
    // iOS sblocca l'audio solo dopo un gesto: il primo tocco basta per tutta la sessione.
    const onFirstTouch = () => unlockAudio();
    window.addEventListener('pointerdown', onFirstTouch, { once: true });
    setReady(true);
    return () => {
      stopWatching();
      stopWakeLock();
      window.removeEventListener('pointerdown', onFirstTouch);
    };
  }, [restore]);

  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme === 'system' ? 'system' : settings.theme);
    setTimerPrefs({ sound: settings.restTimerSound, vibration: settings.restTimerVibration });
  }, [settings, setTimerPrefs]);

  const immersive = IMMERSIVE.some((route) => pathname.startsWith(route));
  const profileLoaded = profile !== undefined;
  const needsOnboarding = ready && profileLoaded && profile === null
    && !isProfileKnownToExist() && !pathname.startsWith('/onboarding');

  if (!ready || !profileLoaded) return <Loading />;

  return (
    <AppShell hideTabBar={immersive}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/schede" element={<PlansPage />} />
          <Route path="/schede/genera" element={<GeneratePage />} />
          <Route path="/schede/:planId" element={<PlanEditorPage />} />
          <Route path="/esercizi" element={<CatalogPage />} />
          <Route path="/esercizi/:slug" element={<ExercisePage />} />
          <Route path="/allenamento" element={<WorkoutPage />} />
          <Route path="/allenamento/:sessionId/riepilogo" element={<SessionSummaryPage />} />
          <Route path="/progressi" element={<ProgressPage />} />
          <Route path="/storico" element={<HistoryPage />} />
          <Route path="/impostazioni" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {!pathname.startsWith('/allenamento') && <RestTimerBar compact />}
      <UpdatePrompt />
    </AppShell>
  );
}
