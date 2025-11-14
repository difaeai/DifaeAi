import { useEffect, useMemo, useState } from 'react';
import { fetchPublicIpAddress, scanLocalNetworkForMacs } from '@/api/network';
import {
  useCameraStore,
  type CameraType,
  type NetworkDeviceCandidate,
} from '@/state/useCameraStore';
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
  const publicIpAddress = useCameraStore((state) => state.publicIpAddress);
  const setPublicIpAddress = useCameraStore((state) => state.setPublicIpAddress);
  const setIpAddress = useCameraStore((state) => state.setIpAddress);
  const selectedMacAddress = useCameraStore((state) => state.selectedMacAddress);
  const setSelectedMacAddress = useCameraStore((state) => state.setSelectedMacAddress);
  const networkDevices = useCameraStore((state) => state.networkDevices);
  const setNetworkDevices = useCameraStore((state) => state.setNetworkDevices);
  const setCredentials = useCameraStore((state) => state.setCredentials);
  const selectedStreamUrl = useCameraStore((state) => state.selectedStreamUrl);
  const setSelectedStreamUrl = useCameraStore((state) => state.setSelectedStreamUrl);
  const [requireCredentials, setRequireCredentials] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string>();
  const [isDetectingPublicIp, setIsDetectingPublicIp] = useState(false);
  const [publicIpError, setPublicIpError] = useState<string>();

  const bridgeCameraId = useMemo(() => {
    if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
    return `camera-${Math.random().toString(36).slice(2, 10)}`;
  }, [cameraType]);

  const hasSimulatedDevices = useMemo(
    () => networkDevices.some((device) => device.isSimulated),
    [networkDevices],
  );

  const nextStep = () => setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  const prevStep = () => setStepIndex((index) => Math.max(index - 1, 0));

  const handleCredentialsSave = () => {
    if (!requireCredentials) {
      setCredentials(undefined, undefined);
      return;
    }
    setCredentials(username.trim(), password);
  };

  const handleNetworkScan = async () => {
    setIsScanning(true);
    setScanError(undefined);
    try {
      const devices = await scanLocalNetworkForMacs();
      setNetworkDevices(devices);
      if (devices.length === 0) {
        setScanError('No devices responded to the MAC address sweep.');
      }
    } catch (error) {
      setScanError((error as Error).message ?? 'Network scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDevice = (device: NetworkDeviceCandidate) => {
    setSelectedMacAddress(device.mac);
    setIpAddress(device.ip);
  };

  const detectPublicIp = async () => {
    setIsDetectingPublicIp(true);
    try {
      const ip = await fetchPublicIpAddress();
      setPublicIpAddress(ip);
      setPublicIpError(undefined);
    } catch (error) {
      setPublicIpError((error as Error).message ?? 'Unable to resolve public IP');
    } finally {
      setIsDetectingPublicIp(false);
    }
  };

  const bridgeTemplate = 'rtsp://admin:XUWHIZ@39.52.121.88:554/Streaming/Channels/101/';
  const publicRtspUrl = useMemo(() => {
    if (!publicIpAddress) {
      return undefined;
    }
    try {
      const url = new URL(bridgeTemplate);
      url.hostname = publicIpAddress;
      return url.toString();
    } catch (error) {
      console.warn('Failed to construct RTSP URL from template', error);
      return `rtsp://admin:XUWHIZ@${publicIpAddress}:554/Streaming/Channels/101/`;
    }
  }, [publicIpAddress]);

  useEffect(() => {
    if (publicRtspUrl && (!selectedStreamUrl || selectedStreamUrl.includes('39.52.121.88'))) {
      setSelectedStreamUrl(publicRtspUrl);
    }
  }, [publicRtspUrl, selectedStreamUrl, setSelectedStreamUrl]);

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

          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-slate-200">Network scan for MAC addresses</h3>
                <p className="text-xs text-slate-400">
                  Discover devices on the LAN and bind the correct MAC address to your camera before performing the cloud handshake.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNetworkScan}
                className="rounded border border-emerald-500 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                disabled={isScanning}
              >
                {isScanning ? 'Scanning…' : 'Scan network'}
              </button>
            </div>
            {scanError && <p className="text-xs text-red-400">{scanError}</p>}
            {networkDevices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Select the MAC address that matches your camera to lock the IP mapping.</p>
                <div className="space-y-2">
                  {networkDevices.map((device) => {
                    const isSelected = selectedMacAddress === device.mac;
                    return (
                      <label
                        key={device.mac}
                        className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border px-3 py-3 text-left transition ${
                          isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium text-slate-100">{device.mac}</span>
                          <span className="block text-xs text-slate-400">IP {device.ip}</span>
                          {device.hostname && (
                            <span className="block text-xs text-slate-500">Hostname {device.hostname}</span>
                          )}
                          {device.vendor && (
                            <span className="block text-xs text-slate-500">Vendor {device.vendor}</span>
                          )}
                          {device.isSimulated && (
                            <span className="mt-1 block text-[10px] uppercase tracking-wide text-amber-400">
                              Simulated discovery example
                            </span>
                          )}
                        </span>
                        <input
                          type="radio"
                          name="mac-selection"
                          value={device.mac}
                          checked={isSelected}
                          onChange={() => handleSelectDevice(device)}
                          className="mt-1 h-4 w-4 accent-emerald-500"
                        />
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500">
                  Selecting a MAC address updates the camera IP to <span className="font-mono text-emerald-300">{ipAddress}</span>.
                </p>
                {hasSimulatedDevices && (
                  <p className="text-[10px] text-amber-400">
                    The listed devices are simulated placeholders when direct LAN scanning is unavailable in the browser.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="font-semibold text-slate-200">Cloud handshake &amp; public IP mapping</h3>
                <p className="text-xs text-slate-400">
                  Because the bridge runs in the cloud, we pair your local camera address with the public IP detected from whatismyip.com.
                  This replaces the LAN address in the RTSP stream so the bridge can reach your camera.
                </p>
                {publicIpAddress && (
                  <p className="mt-2 text-xs text-emerald-300">
                    Detected public IP <span className="font-mono">{publicIpAddress}</span>
                  </p>
                )}
                {ipAddress && publicIpAddress && (
                  <p className="text-[11px] text-slate-400">Local {ipAddress} → Public {publicIpAddress}</p>
                )}
              </div>
              <button
                type="button"
                onClick={detectPublicIp}
                className="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
                disabled={isDetectingPublicIp}
              >
                {isDetectingPublicIp ? 'Detecting…' : 'Detect public IP'}
              </button>
            </div>
            {publicIpError && <p className="text-xs text-red-400">{publicIpError}</p>}
            {publicRtspUrl && (
              <div className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                <p className="text-[11px] font-semibold text-slate-200">Bridge stream URL</p>
                <p className="mt-2 break-all font-mono text-[11px] text-emerald-300">{publicRtspUrl}</p>
                <p className="mt-2 text-[10px] text-slate-500">
                  The original template rtsp://admin:XUWHIZ@39.52.121.88 is now updated with your public IP address.
                </p>
              </div>
            )}
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
