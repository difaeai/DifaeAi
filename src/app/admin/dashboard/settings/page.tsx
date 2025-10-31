
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage your administrator account and global system settings.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Admin Profile</CardTitle>
              <CardDescription>
                Update your personal administrator details here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Admin User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="admin@berreto.com" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">System Settings</CardTitle>
              <CardDescription>
                Manage global settings for the BERRETO platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>New User Signups</Label>
                  <p className="text-xs text-muted-foreground">Allow new users to register on the platform.</p>
                </div>
                <Switch defaultChecked/>
              </div>
               <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                   <p className="text-xs text-muted-foreground">Temporarily disable access to all dashboards.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save System Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Admin Notifications</CardTitle>
              <CardDescription>
                Choose how you receive critical system alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Admin notification settings will be available here.</p>
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
