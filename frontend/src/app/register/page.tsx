"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyDomain: "",
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submit Register - Starting process with:", { ...formData, password: "***" });
    
    try {
      const res = await api.post("/auth/register", formData);
      console.log("Submit Register - Success:", res.data);
      toast.success("Account created successfully!");
      
      // Allow a small delay for the toast to be seen before redirecting via login()
      setTimeout(() => {
        login(res.data.access_token, res.data.user);
      }, 500);
      
    } catch (err: any) {
      console.error("Submit Register - Error:", err);
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-[480px] rounded-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Register your company and start managing your fleet today.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName"
                  placeholder="TransitIQ Ltd." 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyDomain">Subdomain</Label>
                <Input 
                  id="companyDomain"
                  placeholder="transitiq" 
                  value={formData.companyDomain}
                  onChange={e => setFormData({...formData, companyDomain: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Admin Full Name</Label>
              <Input 
                id="fullName"
                placeholder="John Doe" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>

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
              <Label htmlFor="password">Password</Label>
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
              {loading ? <Loader2 className="animate-spin" /> : "Get Started"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t py-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold transition-colors">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
