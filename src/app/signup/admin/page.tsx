
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export default function AdminSignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, {
          displayName: name,
        });

        // This is the critical step: create the user document with admin privileges
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            plan: "Admin",
            cameras: 99, // Assuming a high number for admins
            status: "Active",
            avatar: `https://avatar.vercel.sh/${email}.png`,
            isAdmin: true, // This flag is essential for security rules
        });
      }
      
      toast({
        title: "Account Created!",
        description: "Your administrator account has been successfully created.",
      });
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Admin signup error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use by another account.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. It must be at least 6 characters long.";
      }
       toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center p-4 py-16 md:py-24">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Admin Signup</CardTitle>
              <CardDescription>
                Create a new administrator account with full privileges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Admin Name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="admin@berreto.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full font-headline" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Creating Account...' : 'Create Admin Account'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
