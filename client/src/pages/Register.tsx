import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password);
      toast({
        title: "Account created!",
        description: "Welcome to the void",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Username or email might already be taken",
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
              data-testid="text-register-title"
            >
              REGISTER
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
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                EMAIL
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
                data-testid="input-email"
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
                minLength={6}
                style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
                data-testid="input-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                CONFIRM
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
                data-testid="input-confirm-password"
              />
            </div>

            <button
              type="submit"
              className="null-acquire-btn"
              disabled={isLoading}
              data-testid="button-register"
            >
              {isLoading ? "..." : "CREATE RECORD"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>Have access — </span>
            <Link href="/login">
              <button className="text-[10px] uppercase tracking-[0.1em] text-primary hover:text-foreground transition-colors duration-200" style={{ fontFamily: "var(--font-mono)" }} data-testid="link-login">
                Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
