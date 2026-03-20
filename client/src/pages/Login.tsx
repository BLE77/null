import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 null-bg flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <div className="border border-border p-12">
          <div className="text-center mb-10">
            <h1
              className="text-[13px] uppercase tracking-[0.3em] text-foreground mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
              data-testid="text-login-title"
            >
              ACCESS
            </h1>
            <div style={{ height: "1px", background: "#D8D4C8", width: "40px", margin: "0 auto" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                USERNAME
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
                data-testid="input-username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                PASSWORD
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
                data-testid="input-password"
              />
            </div>

            <button
              type="submit"
              className="null-acquire-btn"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "..." : "ENTER"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>No account — </span>
            <Link href="/register">
              <button className="text-[10px] uppercase tracking-[0.1em] text-primary hover:text-foreground transition-colors duration-200" style={{ fontFamily: "var(--font-mono)" }} data-testid="link-register">
                Register
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
