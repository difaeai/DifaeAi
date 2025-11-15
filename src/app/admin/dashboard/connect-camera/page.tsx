"use client";

import * as React from "react";
import type { FormEvent } from "react";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Video,
  CheckCircle,
  Loader2,
  Info,
  QrCode,
  Cloud,
  Lock,
  Wifi,
  Usb,
  Smartphone,
  Box,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { Camera } from "@/lib/types";
import { cn } from "@/lib/utils";
import LivePreviewPlayer from "@/components/live-preview-player";
import MjpegPreview from "@/components/mjpeg-preview";
import { CameraType, testCameraConnection } from "@/lib/camera-connect";
import { useAuth } from "@/hooks/use-auth";

const DEFAULT_WINDOWS_AGENT_FORM = {
  cameraName: "",
  ipAddress: "",
  username: "",
  password: "",
  rtspPort: "554",
  rtspPath: "/Streaming/Channels/101",
};

// dialogs ko dynamically load karein (no require at runtime)
const ProbeResultsDialog = dynamic(
  () =>
    import("@/components/ui/probe-results-dialog").then(
      (m) => m.ProbeResultsDialog,
    ),
  { ssr: false },
);
const NetworkScannerDialog = dynamic(
  () => import("@/components/ui/network-scanner-dialog"),
  { ssr: false },
);

async function addCamera(
  cameraData: Omit<Camera, "id" | "createdAt">,
): Promise<string> {
  const camerasCollection = collection(
    db,
    "users",
    cameraData.userId,
    "cameras",
  );
  const docRef = await addDoc(camerasCollection, {
    ...cameraData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export default function ConnectCameraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [cameraType, setCameraType] = useState<CameraType | "">("");
  const [isTesting, setIsTesting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [hasWebcamPermission, setHasWebcamPermission] = useState<
    boolean | null
  >(null);

  const [agentForm, setAgentForm] = useState({ ...DEFAULT_WINDOWS_AGENT_FORM });
  const [isGeneratingAgent, setIsGeneratingAgent] = useState(false);
  const [agentDownloadUrl, setAgentDownloadUrl] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);

  const [previewRtspUrl, setPreviewRtspUrl] = useState<string>("");
  const [previewCandidates, setPreviewCandidates] = useState<string[]>([]);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [showMjpegFallback, setShowMjpegFallback] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const cameraTypeOptions = [
    {
      type: "ip" as CameraType,
      icon: <Wifi className="h-8 w-8" />,
      title: "IP Camera",
      description: "Is it a standalone Wi-Fi or Ethernet camera?",
    },
    {
      type: "dvr" as CameraType,
      icon: <Box className="h-8 w-8" />,
      title: "DVR / NVR System",
      description: "Part of a recorder box/system?",
    },
    {
      type: "usb" as CameraType,
      icon: <Usb className="h-8 w-8" />,
      title: "USB Webcam",
      description: "Webcam connected to your computer?",
    },
    {
      type: "mobile" as CameraType,
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile Camera",
      description: "Phone app streaming over Wi-Fi?",
    },
    {
      type: "cloud" as CameraType,
      icon: <Cloud className="h-8 w-8" />,
      title: "Cloud Camera",
      description: "Ring, Nest, Arlo, Wyze, etc.",
    },
  ];

  useEffect(() => {
    const cleanupStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    if (cameraType === "usb") {
      const getWebcamPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          setHasWebcamPermission(true);
          setIsConnectionTested(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (error) {
          setHasWebcamPermission(false);
          toast({
            variant: "destructive",
            title: "Webcam Access Denied",
            description: "Please enable camera permissions in your browser.",
          });
        }
      };
      getWebcamPermission();
    } else {
      cleanupStream();
    }

    return cleanupStream;
  }, [cameraType, toast]);

  useEffect(() => {
    if (cameraType !== "ip") {
      setAgentForm({ ...DEFAULT_WINDOWS_AGENT_FORM });
      setAgentDownloadUrl(null);
      setAgentError(null);
      setIsGeneratingAgent(false);
    }
  }, [cameraType]);

  const [probeResults, setProbeResults] = useState<any[]>([]);
  const [showProbeResults, setShowProbeResults] = useState(false);
  const [probeInProgress, setProbeInProgress] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleTestConnection = async () => {
    if (!formRef.current || !cameraType) return;
    const previousPreviewUrl = previewRtspUrl;

    // quick retest path
    if (previewRtspUrl && isConnectionTested) {
      setIsTesting(true);
      setIsConnectionTested(false);
      toast({
        title: "Attempting live preview...",
        description: "Trying the detected stream URL in the player.",
      });
      return;
    }

    setIsTesting(true);
    setIsConnectionTested(false);
    setPreviewRtspUrl("");
    setShowProbeResults(false);
    setProbeInProgress(false);
    setProbeResults([]);
    setShowMjpegFallback(false);
    setCredentialsError(null);

    toast({
      title: "Testing connection...",
      description:
        cameraType === "cloud"
          ? "Redirecting you for authentication..."
          : "This may take a moment.",
    });

    try {
      const formData = new FormData(formRef.current);
      const username = String(formData.get("stream-user") ?? "").trim();
      const password = String(formData.get("stream-pass") ?? "").trim();
      const result = await testCameraConnection(
        cameraType as CameraType,
        formData,
      );

      const enrichUrl = (url: string | undefined | null) => {
        if (!url) return "";
        if (!username) return url;
        try {
          const u = new URL(url);
          u.username = username;
          if (password) u.password = password;
          return u.toString();
        } catch {
          return url ?? "";
        }
      };

      const isNonEmptyString = (v: string | null | undefined): v is string =>
        !!v;

      if (result.success) {
        if (result.candidates && result.candidates.length > 0) {
          let candidates = [...result.candidates];
          if (previousPreviewUrl) {
            const enriched = enrichUrl(previousPreviewUrl);
            if (enriched && !candidates.includes(enriched)) {
              candidates = [enriched, ...candidates];
            }
          }
          candidates = [
            ...new Set(candidates.map(enrichUrl).filter(isNonEmptyString)),
          ];
          setPreviewCandidates(candidates);
          setCandidateIndex(0);
          if (candidates[0]) {
            setShowMjpegFallback(false);
            setPreviewRtspUrl(candidates[0]);
          }

          try {
            const probeBody: any = {
              candidates,
              timeoutMs: 7000,
              concurrentLimit: 3,
            };
            if (username) probeBody.username = username;
            if (password) probeBody.password = password;

            const probeRes = await fetch("/api/probe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(probeBody),
            });

            const responseStatus = probeRes.status;
            let probeJson: any = null;
            let parseError: string | null = null;
            try {
              probeJson = await probeRes.json();
            } catch (err) {
              parseError = err instanceof Error ? err.message : String(err);
            }

            const detailResults = Array.isArray(probeJson?.results)
              ? probeJson.results
              : [];
            setProbeResults(detailResults);

            const requiresAuth = detailResults.some(
              (r: any) => !!r?.requiresAuth,
            );
            const unauthorizedStatus = detailResults.some((r: any) => {
              const rawStatus = r?.statusCode;
              const status =
                typeof rawStatus === "number"
                  ? rawStatus
                  : Number(rawStatus ?? 0);
              if (status === 401 || status === 403) return true;
              const stderr = typeof r?.stderr === "string" ? r.stderr : "";
              return /401|403|unauthorized|forbidden/i.test(stderr);
            });

            const messageIndicatesAuth =
              typeof probeJson?.message === "string" &&
              /401|403|unauthorized|forbidden|invalid credential|authenticat/i.test(
                probeJson.message,
              );
            const directStatusAuth =
              responseStatus === 401 || responseStatus === 403;
            const parseIndicatesAuth =
              typeof parseError === "string" &&
              /401|403|unauthorized|forbidden/i.test(parseError);

            if (
              !username &&
              (requiresAuth ||
                messageIndicatesAuth ||
                directStatusAuth ||
                parseIndicatesAuth)
            ) {
              const message =
                "This camera requires a username and password. Enter credentials and re-run Test Connection.";
              setCredentialsError(message);
              toast({
                variant: "destructive",
                title: "Authentication Required",
                description: message,
              });
              setIsTesting(false);
              setPreviewCandidates([]);
              setCandidateIndex(0);
              setPreviewRtspUrl("");
              setShowMjpegFallback(false);
              setShowProbeResults(true);
              return;
            }

            if (
              username &&
              (requiresAuth ||
                unauthorizedStatus ||
                messageIndicatesAuth ||
                directStatusAuth ||
                parseIndicatesAuth)
            ) {
              const message =
                "The camera rejected the username or password you entered. Please verify and try again.";
              setCredentialsError(message);
              toast({
                variant: "destructive",
                title: "Invalid Credentials",
                description: message,
              });
              setIsTesting(false);
              setIsConnectionTested(false);
              setPreviewCandidates([]);
              setCandidateIndex(0);
              setPreviewRtspUrl("");
              setShowMjpegFallback(false);
              setShowProbeResults(true);
              return;
            }

            if (!probeJson || typeof probeJson !== "object") {
              const message = parseError
                ? `Server response unreadable: ${parseError}`
                : "Server returned an unexpected response.";
              toast({
                variant: "destructive",
                title: "Probe Error",
                description: message,
              });
              setShowProbeResults(true);
              setIsTesting(false);
              setPreviewCandidates([]);
              setCandidateIndex(0);
              setShowMjpegFallback(true);
              return;
            }

            if (probeJson.success && probeJson.url) {
              setPreviewCandidates([]);
              setPreviewRtspUrl(probeJson.url);
              setIsConnectionTested(true);
              setShowMjpegFallback(false);
              setCredentialsError(null);
              toast({
                title: "Stream Found",
                description: `Found working stream (${probeJson.latencyMs}ms)`,
              });
              if (!probeJson.ffmpegAvailable) {
                toast({
                  variant: "destructive",
                  title: "Server missing ffmpeg",
                  description:
                    "Server does not have ffmpeg installed. Live preview requires ffmpeg on the server; the detected URL will still be saved.",
                });
              }
            } else {
              setShowProbeResults(true);
              toast({
                variant: "destructive",
                title: "Server Probe Failed",
                description: "Trying candidates in the player...",
              });
            }
          } catch {
            setShowProbeResults(true);
            toast({
              variant: "destructive",
              title: "Probe Error",
              description: "Could not check streams. Trying in player...",
            });
          }
        } else if (result.streamUrl) {
          setPreviewCandidates([]);
          const singleCandidate = result.streamUrl;
          if (singleCandidate) {
            setShowMjpegFallback(false);
            setCredentialsError(null);
            setPreviewRtspUrl(singleCandidate);
          }
        } else if (cameraType === "cloud" || cameraType === "usb") {
          setIsConnectionTested(true);
          toast({ title: "Connection Verified!", description: result.message });
        }
      } else {
        setIsConnectionTested(false);
        setShowProbeResults(true);
        setShowMjpegFallback(false);
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: result.message,
        });
      }
    } catch (e) {
      setIsConnectionTested(false);
      toast({ variant: "destructive", title: "Error", description: String(e) });
    }

    setIsTesting(false);
  };

  const handleGenerateWindowsAgent = async () => {
    if (cameraType !== "ip") return;

    if (!user?.uid) {
      const message = "You must be signed in to generate the Windows agent.";
      setAgentError(message);
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: message,
      });
      return;
    }

    const trimmedIp = agentForm.ipAddress.trim();
    const trimmedUsername = agentForm.username.trim();
    const portValue =
      agentForm.rtspPort.trim() || DEFAULT_WINDOWS_AGENT_FORM.rtspPort;
    const pathValue =
      agentForm.rtspPath.trim() || DEFAULT_WINDOWS_AGENT_FORM.rtspPath;

    const ipRegex =
      /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

    if (!trimmedIp) {
      const message = "Camera IP address is required for the Windows agent.";
      setAgentError(message);
      toast({
        variant: "destructive",
        title: "Missing IP Address",
        description: message,
      });
      return;
    }

    if (!ipRegex.test(trimmedIp)) {
      const message = "Enter a valid IPv4 address (e.g., 192.168.1.100).";
      setAgentError(message);
      toast({
        variant: "destructive",
        title: "Invalid IP Address",
        description: message,
      });
      return;
    }

    if (!trimmedUsername) {
      const message = "Camera username is required for the Windows agent.";
      setAgentError(message);
      toast({
        variant: "destructive",
        title: "Missing Username",
        description: message,
      });
      return;
    }

    if (!agentForm.password) {
      const message = "Camera password is required for the Windows agent.";
      setAgentError(message);
      toast({
        variant: "destructive",
        title: "Missing Password",
        description: message,
      });
      return;
    }

    const portNumber = Number(portValue);

    if (
      !Number.isInteger(portNumber) ||
      portNumber <= 0 ||
      portNumber > 65535
    ) {
      const message = "Enter a valid RTSP port between 1 and 65535.";
      setAgentError(message);
      toast({
        variant: "destructive",
        title: "Invalid RTSP Port",
        description: message,
      });
      return;
    }

    const normalizedPath = pathValue.startsWith("/")
      ? pathValue
      : `/${pathValue}`;

    setAgentError(null);
    setAgentDownloadUrl(null);
    setIsGeneratingAgent(true);

    try {
      const payload: Record<string, unknown> = {
        userId: user.uid,
        ipAddress: trimmedIp,
        username: trimmedUsername,
        password: agentForm.password,
        rtspPort: portNumber,
        rtspPath: normalizedPath,
      };

      const trimmedCameraName = agentForm.cameraName.trim();
      if (trimmedCameraName) {
        payload.cameraName = trimmedCameraName;
      }

      const response = await fetch("/api/ip-camera/windows-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || typeof data.downloadUrl !== "string") {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to generate the Windows agent. Please try again.";
        throw new Error(message);
      }

      setAgentDownloadUrl(data.downloadUrl);
      toast({
        title: "Windows Agent Ready",
        description: "Download the customized agent for this camera.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate the Windows agent. Please try again.";
      setAgentError(message);
      toast({
        variant: "destructive",
        title: "Could not generate agent",
        description: message,
      });
    } finally {
      setIsGeneratingAgent(false);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnectionTested) {
      toast({
        variant: "destructive",
        title: "Connection Not Tested",
        description: "Please test the connection before adding the camera.",
      });
      return;
    }
    if (!formRef.current) {
      toast({
        variant: "destructive",
        title: "Form Error",
        description: "An unexpected form error occurred.",
      });
      return;
    }

    setIsAdding(true);
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());

    let uniqueId: string | undefined;
    if (cameraType === "ip")
      uniqueId = previewRtspUrl || (data["stream-url"] as string);
    else if (cameraType === "dvr" || cameraType === "mobile")
      uniqueId = previewRtspUrl;
    else if (cameraType === "usb")
      uniqueId = `webcam_${data.userId}_${Date.now()}`;
    else uniqueId = (data.activationId as string) || undefined;

    if (!uniqueId) {
      toast({
        variant: "destructive",
        title: "Failed to Add Camera",
        description: "Could not determine a unique ID for the camera.",
      });
      setIsAdding(false);
      return;
    }

    try {
      await addCamera({
        userId: data.userId as string,
        name: data.name as string,
        location: data.location as string,
        type: data.cameraType as string,
        uniqueId,
        status: "Online",
        facialRecognition: false,
      });

      toast({
        title: "Camera Added Successfully!",
        description: `Camera '${data.name}' added to user's account.`,
      });
      router.push("/admin/dashboard/cameras");
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to Add Camera",
        description: "Could not save camera to database.",
      });
    }
    setIsAdding(false);
  };

  const handleCameraTypeSelect = (type: CameraType) => {
    setCameraType(type);
    setIsConnectionTested(false);
    setPreviewRtspUrl("");
    setShowMjpegFallback(false);
    setCredentialsError(null);
  };

  const renderFormFields = () => {
    switch (cameraType) {
      case "ip":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>IP Camera Setup</AlertTitle>
              <AlertDescription>
                Just enter your camera's IP address (from router/app). We'll
                detect and connect to the stream.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="camera-ip">Camera IP Address</Label>
              <div className="flex gap-2">
                <Input
                  name="stream-url"
                  id="camera-ip"
                  placeholder="e.g., 192.168.1.100"
                  pattern="^(\d{1,3}\.){3}\d{1,3}$"
                  title="Enter your camera's IP address (e.g., 192.168.1.100)"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScannerOpen(true)}
                >
                  Scan Network
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Most IP cameras look like 192.168.1.xxx on your local network
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stream-user">Username (optional)</Label>
                <Input
                  id="stream-user"
                  name="stream-user"
                  placeholder="e.g., admin"
                  onChange={() => setCredentialsError(null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stream-pass">Password (optional)</Label>
                <Input
                  id="stream-pass"
                  name="stream-pass"
                  placeholder="Camera password"
                  type="password"
                  onChange={() => setCredentialsError(null)}
                />
              </div>
            </div>

            {credentialsError && (
              <p className="text-sm text-destructive">{credentialsError}</p>
            )}

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm hover:no-underline">
                  How to find the IP
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs space-y-3 pt-2">
                    <p className="font-semibold">1) Camera App</p>
                    <p className="text-muted-foreground">
                      Look for Device Info / Network Settings
                    </p>
                    <p className="font-semibold">2) Router</p>
                    <p className="text-muted-foreground">
                      Connected Devices / DHCP Client List
                    </p>
                    <p className="font-semibold">3) Scan</p>
                    <p className="text-muted-foreground">
                      Use the network scanner
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );

      case "dvr":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>DVR / NVR System</AlertTitle>
              <AlertDescription>
                We support most ONVIF-compliant brands (Hikvision, Dahua, CP
                Plus, etc.).
              </AlertDescription>
            </Alert>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dvr-ip">IP Address or Hostname</Label>
                <Input
                  id="dvr-ip"
                  name="dvr-ip"
                  placeholder="e.g., 192.168.1.64"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dvr-port">RTSP Port</Label>
                <Input
                  id="dvr-port"
                  name="dvr-port"
                  type="number"
                  placeholder="e.g., 554"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dvr-user">Username</Label>
                <Input
                  id="dvr-user"
                  name="dvr-user"
                  placeholder="e.g., admin"
                  defaultValue="admin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dvr-pass">Password</Label>
                <Input id="dvr-pass" name="dvr-pass" type="password" required />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              We will attempt to auto-detect brand and stream path during
              testing.
            </p>
          </div>
        );

      case "mobile":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Mobile Camera App Instructions</AlertTitle>
              <AlertDescription>
                Use an IP camera app (IP Webcam, DroidCam, iVCam) and connect
                over Wi-Fi, then enter the IP/port.
              </AlertDescription>
            </Alert>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-ip">Phone's IP Address</Label>
                <Input
                  id="mobile-ip"
                  name="mobile-ip"
                  placeholder="e.g., 192.168.1.10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-port">Port</Label>
                <Input
                  id="mobile-port"
                  name="mobile-port"
                  type="number"
                  placeholder="e.g., 8080"
                  defaultValue="8080"
                  required
                />
              </div>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-center p-4 border rounded-lg bg-muted/50">
              <QrCode className="h-8 w-8 text-primary" />
              <h4 className="font-semibold">Easy Setup with QR Code</h4>
              <p className="text-xs text-muted-foreground">
                Future update: scan QR from mobile app for instant setup.
              </p>
            </div>
          </div>
        );

      case "usb":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>USB Webcam</AlertTitle>
              <AlertDescription>
                Using your connected webcam. Connection auto-tests on selection.
              </AlertDescription>
            </Alert>
          </div>
        );

      case "cloud":
        return (
          <div className="space-y-4 animate-in fade-in">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Cloud Camera System (e.g. Ring, Wyze)</AlertTitle>
              <AlertDescription>
                You’ll be securely redirected to the provider.{" "}
                <strong>We never see or store your password.</strong>
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="cloud-provider">Select Provider</Label>
              <Select name="cloud-provider" required>
                <SelectTrigger id="cloud-provider">
                  <SelectValue placeholder="Select a cloud provider..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nest">Google Nest</SelectItem>
                  <SelectItem value="ring">Amazon Ring</SelectItem>
                  <SelectItem value="arlo">Arlo</SelectItem>
                  <SelectItem value="wyze">Wyze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPreview = () => {
    if (cameraType === "usb") {
      return (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {hasWebcamPermission === null && (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting
              camera access...
            </div>
          )}
          {hasWebcamPermission === false && (
            <div className="text-center text-destructive p-4">
              <p className="font-bold">Camera access denied.</p>
            </div>
          )}
        </div>
      );
    }

    if (previewRtspUrl) {
      const normalized = previewRtspUrl.toLowerCase();
      const isRtsp =
        normalized.startsWith("rtsp://") || normalized.startsWith("rtsps://");
      if (!isRtsp) {
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={previewRtspUrl}
              alt="Camera MJPEG stream"
              className="w-full h-full object-cover"
            />
          </div>
        );
      }

      const tryNextCandidate = (errorMessage?: string) => {
        if (
          previewCandidates &&
          previewCandidates.length > candidateIndex + 1
        ) {
          const nextIndex = candidateIndex + 1;
          setCandidateIndex(nextIndex);
          setPreviewRtspUrl(previewCandidates[nextIndex]);
          const base = `Attempt ${nextIndex + 1} of ${previewCandidates.length}`;
          const description = errorMessage
            ? `${errorMessage} Retrying... (${base})`
            : base;
          toast({ title: "Trying alternative stream path...", description });
        } else {
          setIsConnectionTested(false);
          setPreviewCandidates([]);
          setCandidateIndex(0);
          setPreviewRtspUrl("");
          setShowMjpegFallback(true);
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description:
              errorMessage || "Could not connect using common stream paths.",
          });
        }
      };

      return (
        <LivePreviewPlayer
          rtspUrl={previewRtspUrl}
          onReady={() => {
            setIsTesting(false);
            setIsConnectionTested(true);
            setShowMjpegFallback(false);
            setPreviewCandidates([]);
            setCandidateIndex(0);
            toast({
              title: "Connection Verified!",
              description: "Live stream is playing successfully.",
            });
          }}
          onError={(message) => {
            setIsTesting(false);
            tryNextCandidate(
              message || "Could not connect to the camera stream.",
            );
          }}
        />
      );
    }

    if (showMjpegFallback) {
      let fallbackIp = "";
      let fallbackUser = "";
      let fallbackPass = "";
      if (formRef.current) {
        const fd = new FormData(formRef.current);
        fallbackIp = String(fd.get("stream-url") ?? "").trim();
        fallbackUser = String(fd.get("stream-user") ?? "").trim();
        fallbackPass = String(fd.get("stream-pass") ?? "").trim();
      }
      if (fallbackIp) {
        return (
          <div className="space-y-3">
            <MjpegPreview
              ip={fallbackIp}
              username={fallbackUser || undefined}
              password={fallbackPass || undefined}
              onFound={(url) => {
                setPreviewRtspUrl(url);
                setShowMjpegFallback(false);
                setIsConnectionTested(true);
                toast({
                  title: "MJPEG Stream Found",
                  description: "Connected via HTTP fallback stream.",
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Trying an MJPEG fallback stream. If the preview remains blank,
              check credentials and network access.
            </p>
          </div>
        );
      }
    }

    if (isConnectionTested && cameraType === "cloud") {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
          <div className="text-center p-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="font-semibold mt-2">Cloud Connection Verified</p>
            <p className="text-xs mt-1">
              Live preview is not available on this page for cloud cameras.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Video className="mx-auto h-12 w-12" />
          <p>Preview will appear here after a successful test.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ProbeResultsDialog
        open={showProbeResults}
        onClose={() => setShowProbeResults(false)}
        results={probeResults}
        inProgress={probeInProgress}
      />

      <NetworkScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelect={async (
          ip: string,
          streamUrl?: string,
          verified?: boolean,
        ) => {
          const el = document.getElementById(
            "camera-ip",
          ) as HTMLInputElement | null;
          if (el) el.value = ip;
          setScannerOpen(false);
          setCredentialsError(null);
          setShowMjpegFallback(false);
          if (streamUrl) {
            setPreviewCandidates([]);
            setCandidateIndex(0);
            setPreviewRtspUrl(streamUrl);
            if (verified) {
              setIsConnectionTested(true);
              toast({
                title: "Stream Found",
                description: "Automatically detected a working stream.",
              });
            } else {
              setIsConnectionTested(false);
            }
          }
        }}
      />

      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cameras
        </Button>
        <h1 className="text-3xl font-bold font-headline">
          Connect a New Camera
        </h1>
        <p className="text-muted-foreground">
          Follow the steps to add and activate a new camera in your system.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleAddCamera}>
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Activation ID</CardTitle>
            <CardDescription>
              Enter the Unique Activation ID from your approved purchase to
              begin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activation-id">Activation ID</Label>
              <Input
                id="activation-id"
                name="activationId"
                placeholder="e.g., DSGPRO-G4H7J2K9L"
                required
              />
              <p className="text-xs text-muted-foreground">
                Find this on your{" "}
                <Link href="/dashboard/my-orders" className="underline">
                  My Subscriptions
                </Link>{" "}
                page.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                name="userId"
                placeholder="Enter the user's unique ID"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Step 2: Camera Details</CardTitle>
            <CardDescription>
              Give your camera a descriptive name and specify its location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camera-name">Camera Name</Label>
                <Input
                  id="camera-name"
                  name="name"
                  placeholder="e.g., Front Door Cam"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camera-location">Location</Label>
                <Input
                  id="camera-location"
                  name="location"
                  placeholder="e.g., Entrance"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Step 3: What kind of camera are you connecting?
            </CardTitle>
            <CardDescription>
              Select the option that best describes your camera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input type="hidden" name="cameraType" value={cameraType} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameraTypeOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleCameraTypeSelect(option.type)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left flex flex-col items-center justify-center text-center hover:border-primary hover:bg-accent transition-all space-y-2 h-full",
                    cameraType === option.type
                      ? "border-primary bg-accent shadow-md"
                      : "bg-card",
                  )}
                >
                  {option.icon}
                  <h3 className="font-semibold">{option.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
            {!cameraType && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Please select a camera type to continue.
              </p>
            )}
          </CardContent>
        </Card>

        {cameraType && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Step 4: Enter Connection Details &amp; Preview
              </CardTitle>
              <CardDescription>
                Provide the necessary details and verify the live feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">{renderFormFields()}</div>
              <div className="space-y-4">
                <Label>Live Preview</Label>
                {renderPreview()}
              </div>
            </CardContent>

            {cameraType && (
              <CardFooter className="flex-col items-start gap-6 border-t pt-6">
                {(cameraType === "ip" ||
                  cameraType === "dvr" ||
                  cameraType === "mobile") && (
                  <div className="w-full space-y-2">
                    <h3 className="font-semibold">Step 5: Test Connection</h3>
                    <p className="text-sm text-muted-foreground -mt-1">
                      Verify that BERRETO can connect to your camera before
                      adding it.
                    </p>
                    <Button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </div>
                )}

                {cameraType === "ip" && (
                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        Step 6: Configure Windows Agent
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Before you download the agent, please enter your camera
                        details. We will generate a small .exe file configured
                        only for your camera. Run it on a Windows PC on the same
                        local network as your camera.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The agent runs silently in the background and
                        automatically starts with Windows.
                      </p>
                    </div>

                    {agentDownloadUrl ? (
                      <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Windows agent ready to download
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Download the file, run it once on a Windows PC that is
                          on the same network as your camera. After that you can
                          close everything – the agent will run as a background
                          service automatically.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button asChild size="lg">
                            <a href={agentDownloadUrl} download>
                              <Download className="mr-2 h-4 w-4" />
                              Download Windows Agent (.exe)
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setAgentError(null);
                              setAgentDownloadUrl(null);
                            }}
                          >
                            Generate again
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="agent-camera-name">
                              Camera Name (optional)
                            </Label>
                            <Input
                              id="agent-camera-name"
                              name="agent-camera-name"
                              placeholder="e.g., Front Door"
                              value={agentForm.cameraName}
                              onChange={(event) => {
                                setAgentForm((prev) => ({
                                  ...prev,
                                  cameraName: event.target.value,
                                }));
                                setAgentError(null);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="agent-ip-address">
                              Camera Local IP
                            </Label>
                            <Input
                              id="agent-ip-address"
                              name="agent-ip-address"
                              placeholder="192.168.18.130"
                              value={agentForm.ipAddress}
                              onChange={(event) => {
                                setAgentForm((prev) => ({
                                  ...prev,
                                  ipAddress: event.target.value,
                                }));
                                setAgentError(null);
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="agent-username">
                              Camera Username
                            </Label>
                            <Input
                              id="agent-username"
                              name="agent-username"
                              placeholder="e.g., admin"
                              value={agentForm.username}
                              onChange={(event) => {
                                setAgentForm((prev) => ({
                                  ...prev,
                                  username: event.target.value,
                                }));
                                setAgentError(null);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="agent-password">
                              Camera Password
                            </Label>
                            <Input
                              id="agent-password"
                              name="agent-password"
                              type="password"
                              placeholder="Password"
                              value={agentForm.password}
                              onChange={(event) => {
                                setAgentForm((prev) => ({
                                  ...prev,
                                  password: event.target.value,
                                }));
                                setAgentError(null);
                              }}
                            />
                          </div>
                        </div>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="agent-advanced">
                            <AccordionTrigger className="text-sm hover:no-underline">
                              Advanced RTSP settings
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid gap-4 pt-2 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor="agent-rtsp-port">
                                    RTSP Port
                                  </Label>
                                  <Input
                                    id="agent-rtsp-port"
                                    name="agent-rtsp-port"
                                    type="number"
                                    min={1}
                                    max={65535}
                                    value={agentForm.rtspPort}
                                    onChange={(event) => {
                                      setAgentForm((prev) => ({
                                        ...prev,
                                        rtspPort: event.target.value,
                                      }));
                                      setAgentError(null);
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="agent-rtsp-path">
                                    RTSP Path
                                  </Label>
                                  <Input
                                    id="agent-rtsp-path"
                                    name="agent-rtsp-path"
                                    placeholder="/Streaming/Channels/101"
                                    value={agentForm.rtspPath}
                                    onChange={(event) => {
                                      setAgentForm((prev) => ({
                                        ...prev,
                                        rtspPath: event.target.value,
                                      }));
                                      setAgentError(null);
                                    }}
                                  />
                                </div>
                              </div>
                              <p className="pt-2 text-xs text-muted-foreground">
                                Most cameras use port 554 and the path
                                /Streaming/Channels/101 (Hikvision-style
                                devices).
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {agentError && (
                          <p className="text-sm text-destructive">
                            {agentError}
                          </p>
                        )}

                        <Button
                          type="button"
                          onClick={handleGenerateWindowsAgent}
                          disabled={isGeneratingAgent}
                        >
                          {isGeneratingAgent ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate Windows Agent"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardFooter>
            )}
          </Card>
        )}

        {cameraType && (
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={!isConnectionTested || isTesting || isAdding}
            >
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-4 w-4" />
              {isAdding ? "Adding Camera..." : "Add Camera to System"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
