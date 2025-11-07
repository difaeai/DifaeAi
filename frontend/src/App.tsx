import { OnboardingWizard } from './components/OnboardingWizard';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Camera Bridge</h1>
            <p className="text-sm text-slate-400">
              Connect your authorized cameras securely for live preview and recording.
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <OnboardingWizard />
      </main>
    </div>
  );
}

export default App;
