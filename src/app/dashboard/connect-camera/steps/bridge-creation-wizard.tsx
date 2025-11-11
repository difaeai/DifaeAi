"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, Terminal, Download, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BridgeCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (bridgeConfig: {
    bridgeId: string;
    bridgeUrl: string;
    bridgeName: string;
    bridgeApiKey?: string;
  }) => void;
}

// Secure random ID generator using Web Crypto API
const generateSecureId = (prefix: string, length: number = 16): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const randomString = Array.from(array, byte => byte.toString(36)).join('').substring(0, length);
  return `${prefix}-${randomString}`;
};

export function BridgeCreationWizard({ open, onClose, onComplete }: BridgeCreationWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"generate" | "install" | "verify">("generate");
  
  // Auto-generated values (editable)
  const [bridgeId, setBridgeId] = useState(() => generateSecureId("bridge", 12));
  const [bridgeName, setBridgeName] = useState("My Home Bridge");
  const [bridgeUrl, setBridgeUrl] = useState("http://localhost:8080");
  const [useApiKey, setUseApiKey] = useState(false);
  const [bridgeApiKey, setBridgeApiKey] = useState("");
  
  const [copied, setCopied] = useState<string | null>(null);

  // Generate API key when user enables authentication
  const handleApiKeyToggle = (enabled: boolean) => {
    setUseApiKey(enabled);
    if (enabled && !bridgeApiKey) {
      setBridgeApiKey(generateSecureId("key", 24));
    }
  };

  const dockerCommand = `docker run -d \\
  --name berreto-bridge \\
  -p 8080:8080 \\
  -e BRIDGE_ID=${bridgeId} \\
  -e BRIDGE_NAME="${bridgeName}" \\
  ${useApiKey ? `-e API_KEY=${bridgeApiKey} \\\n  ` : ''}berreto/camera-bridge:latest`;

  const npmCommand = `# Install the bridge
npm install -g @berreto/camera-bridge

# Run the bridge
BRIDGE_ID=${bridgeId} \\
BRIDGE_NAME="${bridgeName}" \\
${useApiKey ? `API_KEY=${bridgeApiKey} \\\n` : ''}berreto-bridge start`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleComplete = () => {
    onComplete({
      bridgeId,
      bridgeUrl,
      bridgeName,
      bridgeApiKey: useApiKey ? bridgeApiKey : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Create Camera Bridge</DialogTitle>
          <DialogDescription>
            Set up a bridge to connect your local network cameras to cloud-hosted BERRETO
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Generate Configuration */}
        {step === "generate" && (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>What is a Camera Bridge?</AlertTitle>
              <AlertDescription>
                A bridge runs on your local network and securely streams camera feeds to the cloud. 
                We'll generate configuration values for you.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gen-bridge-id">Bridge ID</Label>
                <div className="flex gap-2">
                  <Input 
                    id="gen-bridge-id"
                    value={bridgeId} 
                    onChange={(e) => setBridgeId(e.target.value)}
                    className="font-mono" 
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(bridgeId, "Bridge ID")}
                  >
                    {copied === "Bridge ID" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBridgeId(generateSecureId("bridge", 12))}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Unique identifier for your bridge (auto-generated, but you can edit it)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bridge-name-wizard">Bridge Name</Label>
                <Input
                  id="bridge-name-wizard"
                  value={bridgeName}
                  onChange={(e) => setBridgeName(e.target.value)}
                  placeholder="My Home Bridge"
                />
                <p className="text-xs text-muted-foreground">Friendly name to identify your bridge</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bridge-url-wizard">Bridge URL</Label>
                <Input
                  id="bridge-url-wizard"
                  value={bridgeUrl}
                  onChange={(e) => setBridgeUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                />
                <div className="text-xs space-y-2">
                  <p className="text-muted-foreground">Quick presets:</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBridgeUrl("http://localhost:8080")}
                      className="text-xs"
                    >
                      This Computer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBridgeUrl("http://192.168.1.100:8080")}
                      className="text-xs"
                    >
                      LAN Device (edit IP)
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-2">• Use <code className="bg-muted px-1 rounded">http://localhost:8080</code> if installing on this computer</p>
                  <p className="text-muted-foreground">• Use <code className="bg-muted px-1 rounded">http://192.168.1.X:8080</code> if installing on another device</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-md">
                <input
                  type="checkbox"
                  id="use-api-key-wizard"
                  checked={useApiKey}
                  onChange={(e) => handleApiKeyToggle(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="use-api-key-wizard" className="cursor-pointer">
                  Enable API Key Authentication (Recommended)
                </Label>
              </div>

              {useApiKey && (
                <div className="space-y-2">
                  <Label htmlFor="gen-api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="gen-api-key"
                      value={bridgeApiKey} 
                      onChange={(e) => setBridgeApiKey(e.target.value)}
                      className="font-mono" 
                      type="password" 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(bridgeApiKey, "API Key")}
                    >
                      {copied === "API Key" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBridgeApiKey(generateSecureId("key", 24))}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Secure API key (auto-generated, but you can edit it)</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => setStep("install")}>Next: Install Bridge →</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Installation Instructions */}
        {step === "install" && (
          <div className="space-y-6">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Install the Bridge</AlertTitle>
              <AlertDescription>
                Copy and run one of the commands below on the computer that can access your cameras.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="docker" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="docker">🐳 Docker (Recommended)</TabsTrigger>
                <TabsTrigger value="npm">📦 npm/Node.js</TabsTrigger>
              </TabsList>

              <TabsContent value="docker" className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Docker Command</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(dockerCommand, "Docker command")}
                    >
                      {copied === "Docker command" ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Command
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-xs overflow-x-auto font-mono">
                    {dockerCommand}
                  </pre>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950/30">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Make sure Docker is installed. Visit <a href="https://docs.docker.com/get-docker/" target="_blank" className="underline">docs.docker.com</a> if you need to install it.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="npm" className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>npm Command</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(npmCommand, "npm command")}
                    >
                      {copied === "npm command" ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Command
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-xs overflow-x-auto font-mono">
                    {npmCommand}
                  </pre>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950/30">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Requires Node.js 18+ and npm. Visit <a href="https://nodejs.org/" target="_blank" className="underline">nodejs.org</a> if you need to install it.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("generate")}>← Back</Button>
              <Button onClick={() => setStep("verify")}>Next: Verify Bridge →</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Verify and Complete */}
        {step === "verify" && (
          <div className="space-y-6">
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900 dark:text-green-100">Bridge Configuration Ready</AlertTitle>
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your bridge configuration has been generated and is ready to use.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 border rounded-md bg-muted/30">
              <h3 className="font-semibold text-sm">Configuration Summary</h3>
              
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bridge ID:</span>
                  <span className="font-mono font-medium">{bridgeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bridge Name:</span>
                  <span className="font-medium">{bridgeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bridge URL:</span>
                  <span className="font-mono font-medium">{bridgeUrl}</span>
                </div>
                {useApiKey && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Key:</span>
                    <span className="font-mono font-medium">••••••••{bridgeApiKey.slice(-4)}</span>
                  </div>
                )}
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Next Steps</AlertTitle>
              <AlertDescription className="text-xs space-y-2">
                <p>1. Make sure the bridge is running (check your terminal for "Bridge started successfully")</p>
                <p>2. Click "Complete Setup" below to auto-fill the camera connection form</p>
                <p>3. Enter your camera's IP address to continue</p>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("install")}>← Back</Button>
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
