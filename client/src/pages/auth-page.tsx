import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/generated_images/abstract_geometric_blue_tech_logo.png";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await login(values.email, values.password);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <img src={logoImage} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
              </div>
            </div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">Enter your credentials to access your workspace.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email address" {...field} className="h-11" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="h-11" data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading} data-testid="button-login">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Demo Credentials</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                 <div className="p-2 rounded border bg-muted/30">
                    <span className="font-semibold block text-foreground">Manager</span>
                    <span className="text-[10px]">manager@workquest.com</span>
                 </div>
                 <div className="p-2 rounded border bg-muted/30">
                    <span className="font-semibold block text-foreground">Technician</span>
                    <span className="text-[10px]">tech@workquest.com</span>
                 </div>
                 <div className="p-2 rounded border bg-muted/30">
                    <span className="font-semibold block text-foreground">Employee</span>
                    <span className="text-[10px]">employee@workquest.com</span>
                 </div>
              </div>

            </form>
          </Form>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 z-10"></div>
        <div className="relative z-20 text-center space-y-6 max-w-lg px-6">
             <img src={logoImage} alt="Logo Large" className="w-64 h-64 mx-auto rounded-2xl shadow-2xl shadow-blue-500/20 mb-8 object-cover" />
             <h2 className="text-3xl font-heading font-bold text-white">Streamline Your Facilities Management</h2>
             <p className="text-slate-400 text-lg leading-relaxed">
               Manage requests, assign tasks, and track maintenance in real-time with WorkQuest's intelligent platform.
             </p>
        </div>
      </div>
    </div>
  );
}