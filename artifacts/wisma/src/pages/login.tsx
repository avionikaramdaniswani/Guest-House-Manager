import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, Delete } from "lucide-react";

export default function Login() {
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) return;

    loginMutation.mutate(
      { data: { pin } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast({ title: "Welcome back", description: `Logged in as ${data.staff}` });
          setLocation("/");
        },
        onError: () => {
          toast({ title: "Login failed", description: "Invalid PIN", variant: "destructive" });
          setPin("");
        }
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wisma Eucaliptus</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter your 4-digit PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-14 h-16 rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-all ${
                  pin[i] 
                    ? 'border-primary text-primary shadow-sm bg-primary/5' 
                    : 'border-gray-200 dark:border-zinc-800 text-transparent'
                }`}
              >
                {pin[i] ? "•" : ""}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                className="h-16 text-2xl font-medium rounded-xl border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
                onClick={() => handleKeyPress(num.toString())}
              >
                {num}
              </Button>
            ))}
            <div />
            <Button
              type="button"
              variant="outline"
              className="h-16 text-2xl font-medium rounded-xl border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
              onClick={() => handleKeyPress("0")}
            >
              0
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-16 rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
              onClick={handleDelete}
            >
              <Delete className="w-8 h-8" />
            </Button>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg rounded-xl"
            disabled={pin.length !== 4 || loginMutation.isPending}
          >
            {loginMutation.isPending ? "Verifying..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
