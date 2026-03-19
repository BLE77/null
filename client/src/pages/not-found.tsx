import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center null-bg">
      <div className="text-center px-4">
        <h1
          className="text-6xl font-light uppercase tracking-[0.25em] text-foreground/20 mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          404
        </h1>
        <p className="text-sm text-foreground/50 uppercase tracking-[0.15em] mb-8">
          Nothing here. As intended.
        </p>
        <Link href="/">
          <Button variant="outline" className="uppercase tracking-[0.15em] text-xs">
            Return
          </Button>
        </Link>
      </div>
    </div>
  );
}
