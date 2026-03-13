"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submit Login - Starting process for:", formData.email);
    
    try {
      const res = await api.post("/auth/login", formData);
      console.log("Submit Login - Success:", res.data);
      toast.success("Welcome back!");
      
      // Allow a small delay for the toast
      setTimeout(() => {
        login(res.data.access_token, res.data.user);
      }, 500);
      
    } catch (err: any) {
      console.error("Submit Login - Error:", err);
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-[420px] rounded-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                type="email"
                placeholder="admin@company.com" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password"
                type="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <Button disabled={loading} className="w-full h-12">
              {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t py-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-bold transition-colors">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
