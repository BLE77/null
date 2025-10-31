import logoImage from "@assets/OFF_HUMAN_transparent.png";

interface LogoProps {
  variant?: "hero" | "nav";
  className?: string;
}

export function Logo({ variant = "nav", className = "" }: LogoProps) {
  const isHero = variant === "hero";
  
  return (
    <div className={`logo-container ${isHero ? "logo-hero" : "logo-nav"} ${className}`}>
      <img 
        src={logoImage} 
        alt="OFF HUMAN"
        className={`logo-image ${isHero ? "w-auto h-24 md:h-32 lg:h-40" : "h-8"}`}
        data-testid={`logo-${variant}`}
      />
      <div className="glitch-scanline" />
    </div>
  );
}
