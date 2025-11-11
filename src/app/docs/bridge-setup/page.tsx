import { Metadata } from "next";
import { ArrowLeft, Copy, Terminal, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Camera Bridge Setup Guide | BERRETO",
  description: "Learn how to set up and configure the Universal Camera Bridge to stream local network cameras",
};

export default function BridgeSetupPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Link href="/dashboard/connect-camera" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Connect Camera
      </Link>

      <h1 className="text-4xl font-bold font-headline mb-4">Camera Bridge Setup Guide</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Stream cameras from your local network to the cloud-hosted BERRETO app.
      </p>

      <Alert className="mb-8">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Where to Find Configuration Values</AlertTitle>
        <AlertDescription>
          The values you need are set when you start your Camera Bridge. Check your bridge's startup logs or configuration file.
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Field Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Bridge ID
              </h3>
              <p className="text-sm text-muted-foreground">
                This is the unique identifier you set when starting the bridge.
              </p>
              <div className="bg-muted rounded-md p-4 font-mono text-sm">
                <p className="text-xs text-muted-foreground mb-2">Docker example:</p>
                <code>-e BRIDGE_ID=my-home-bridge</code>
                <p className="text-xs text-muted-foreground mt-3 mb-2">.env file example:</p>
                <code>BRIDGE_ID=my-home-bridge</code>
              </div>
              <p className="text-xs text-muted-foreground">
                ✅ Use this exact value in the "Bridge ID" field above
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Bridge URL
              </h3>
              <p className="text-sm text-muted-foreground">
                The URL where your bridge is running. This depends on where you installed it.
              </p>
              <div className="bg-muted rounded-md p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-1">If bridge is on THIS computer:</p>
                  <code className="text-sm">http://localhost:8080</code>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">If bridge is on ANOTHER device on your network:</p>
                  <code className="text-sm">http://192.168.1.100:8080</code>
                  <p className="text-xs text-muted-foreground mt-1">(Replace 192.168.1.100 with your device's IP address)</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 To find your device's IP: Run <code className="bg-muted px-1 rounded">ipconfig</code> (Windows) or <code className="bg-muted px-1 rounded">ifconfig</code> (Mac/Linux)
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Bridge Name
              </h3>
              <p className="text-sm text-muted-foreground">
                A friendly name to help you identify this bridge. You set this when starting the bridge.
              </p>
              <div className="bg-muted rounded-md p-4 font-mono text-sm">
                <p className="text-xs text-muted-foreground mb-2">Docker example:</p>
                <code>-e BRIDGE_NAME="My Home Bridge"</code>
                <p className="text-xs text-muted-foreground mt-3 mb-2">.env file example:</p>
                <code>BRIDGE_NAME=My Home Bridge</code>
              </div>
              <p className="text-xs text-muted-foreground">
                ✅ Enter this same name in the "Bridge Name" field
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Bridge API Key (Optional)
              </h3>
              <p className="text-sm text-muted-foreground">
                Only required if you enabled authentication when starting the bridge.
              </p>
              <div className="bg-muted rounded-md p-4 font-mono text-sm">
                <p className="text-xs text-muted-foreground mb-2">Docker example:</p>
                <code>-e API_KEY=your-secret-api-key</code>
                <p className="text-xs text-muted-foreground mt-3 mb-2">.env file example:</p>
                <code>API_KEY=your-secret-api-key</code>
              </div>
              <p className="text-xs text-muted-foreground">
                ℹ️ Leave blank if you didn't set an API_KEY
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start: Installing the Bridge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Don't have a bridge yet?</AlertTitle>
              <AlertDescription>
                Follow these steps to install the Camera Bridge on your local network.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-semibold">Option 1: Docker (Recommended)</h4>
              <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                <pre>{`docker run -d \\
  --name berreto-bridge \\
  --network host \\
  -e BRIDGE_ID=my-home-bridge \\
  -e BRIDGE_NAME="My Home Bridge" \\
  -e API_KEY=your-secret-api-key \\
  berreto/camera-bridge:latest`}</pre>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Option 2: Node.js</h4>
              <div className="bg-muted rounded-md p-4 space-y-2">
                <p className="text-xs text-muted-foreground">1. Clone repository:</p>
                <code className="text-sm">git clone https://github.com/berreto/camera-bridge.git</code>
                
                <p className="text-xs text-muted-foreground mt-3">2. Create .env file:</p>
                <pre className="text-sm">{`BRIDGE_ID=my-home-bridge
BRIDGE_NAME=My Home Bridge
API_KEY=your-secret-api-key
PORT=8080`}</pre>
                
                <p className="text-xs text-muted-foreground mt-3">3. Run:</p>
                <code className="text-sm">npm install && npm start</code>
              </div>
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">After Installation</AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                The bridge will print your configuration values in the startup logs. Copy those exact values into the form above!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-2">❌ "Bridge not found"</p>
              <p className="text-muted-foreground">Make sure your Bridge ID exactly matches the BRIDGE_ID you used when starting the bridge.</p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">❌ "Cannot connect to bridge"</p>
              <p className="text-muted-foreground">
                Check that:
                <br />• Bridge is running (check with <code className="bg-muted px-1 rounded">docker ps</code> or check the Node process)
                <br />• Bridge URL is correct (try opening it in your browser)
                <br />• You're on the same network as the bridge
              </p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">❌ "Invalid API key"</p>
              <p className="text-muted-foreground">The API key must exactly match what you set in the bridge configuration. If you didn't set one, leave the field blank.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4">
          <Link href="/dashboard/connect-camera">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Camera Setup
            </Button>
          </Link>
          
          <Link href="https://github.com/berreto/camera-bridge" target="_blank">
            <Button variant="link">
              View Full Documentation →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
