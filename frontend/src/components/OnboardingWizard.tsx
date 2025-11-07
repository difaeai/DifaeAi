import { useMemo, useState } from 'react';
import { useCameraStore, type CameraType } from '@/state/useCameraStore';
import { TestConnection } from './TestConnection';

const steps = [
  { id: 1, title: 'Camera Type', description: 'Select the kind of device you are onboarding.' },
  { id: 2, title: 'Network & Credentials', description: 'Confirm discovery details and provide credentials only when required.' },
  { id: 3, title: 'Test Connection', description: 'Probe for supported streams and preview.' },
];

const cameraTypes: { label: string; value: CameraType; description: string }[] = [
  { label: 'IP Camera', value: 'ip', description: 'Direct network camera available on the LAN.' },
  { label: 'DVR / NVR', value: 'dvr', description: 'Recorder device that exposes multiple channels.' },
  { label: 'USB', value: 'usb', description: 'Cameras connected via USB to the bridge agent.' },
  { label: 'Mobile', value: 'mobile', description: 'Mobile app or device streaming via HTTPS.' },
  { label: 'Cloud', value: 'cloud', description: 'Vendor provided cloud stream.' },
];

export function OnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const cameraType = useCameraStore((state) => state.cameraType);
  const setCameraType = useCameraStore((state) => state.setCameraType);
  const ipAddress = useCameraStore((state) => state.ipAddress);
  const setIpAddress = useCameraStore((state) => state.setIpAddress);
  const setCredentials = useCameraStore((state) => state.setCredentials);
  const [requireCredentials, setRequireCredentials] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const bridgeCameraId = useMemo(() => {
    if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
    return `camera-${Math.random().toString(36).slice(2, 10)}`;
  }, [cameraType]);

  const nextStep = () => setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  const prevStep = () => setStepIndex((index) => Math.max(index - 1, 0));

  const handleCredentialsSave = () => {
    if (!requireCredentials) {
      setCredentials(undefined, undefined);
      return;
    }
    setCredentials(username.trim(), password);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 shadow-lg shadow-slate-950/40">
      <Stepper stepIndex={stepIndex} />

      {stepIndex === 0 && (
        <section className="space-y-4">
          <p className="text-sm text-slate-400">{steps[0].description}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {cameraTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setCameraType(type.value)}
                className={`rounded-lg border px-4 py-4 text-left transition ${
                  cameraType === type.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
                }`}
              >
                <h3 className="font-semibold">{type.label}</h3>
                <p className="mt-1 text-xs text-slate-400">{type.description}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={nextStep} className="rounded bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400">
              Continue
            </button>
          </div>
        </section>
      )}

      {stepIndex === 1 && (
        <section className="space-y-5">
          <p className="text-sm text-slate-400">
            We start with a gentle discovery scan. Confirm the IP or hostname of your camera. Discovery uses ONVIF, SSDP, and optional ARP pings with rate limits.
          </p>
          <div className="space-y-2">
            <label htmlFor="ipAddress" className="text-sm font-medium text-slate-200">
              Camera IP or hostname
            </label>
            <input
              id="ipAddress"
              value={ipAddress}
              onChange={(event) => setIpAddress(event.target.value)}
              placeholder="e.g. 192.168.1.120"
              className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
            />
            <p className="text-xs text-slate-500">
              Only scan networks and devices you own or have explicit permission to access. The rate limit defaults to 1 probe/second.
            </p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input type="checkbox" checked={requireCredentials} onChange={(event) => setRequireCredentials(event.target.checked)} />
              Require credentials for this camera
            </label>
            {requireCredentials && (
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                  className="rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
                />
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <button onClick={prevStep} className="rounded border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900">
              Back
            </button>
            <button
              onClick={() => {
                handleCredentialsSave();
                nextStep();
              }}
              disabled={!ipAddress}
              className="rounded bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {stepIndex === 2 && (
        <section className="space-y-5">
          <p className="text-sm text-slate-400">
            When you select a candidate stream, we attempt an HLS preview via the local bridge agent. Keep traffic on your LAN whenever possible. All requests are logged.
          </p>

          <TestConnection bridgeCameraId={bridgeCameraId} />

          <div className="rounded border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">If no streams are found:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Confirm the camera is reachable from this machine and not firewalled.</li>
              <li>Run the bridge agent to access cameras that are not routable from the backend.</li>
              <li>Review the audit log in Settings to see previous access attempts.</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

interface StepperProps {
  stepIndex: number;
}

function Stepper({ stepIndex }: StepperProps) {
  return (
    <div className="mb-6 flex items-center gap-4">
      {steps.map((step, index) => {
        const state = index === stepIndex ? 'current' : index < stepIndex ? 'complete' : 'upcoming';
        return (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                state === 'current' ? 'bg-emerald-500 text-slate-950' : state === 'complete' ? 'bg-emerald-500/60 text-slate-900' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {step.id}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{step.title}</p>
              <p className="text-xs text-slate-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && <div className="h-px flex-1 bg-slate-800" />}
          </div>
        );
      })}
    </div>
  );
}
