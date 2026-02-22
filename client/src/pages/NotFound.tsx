import { useLocation } from "wouter";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}
    >
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)", filter: "blur(60px)" }} />

      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div
        className="relative z-10 text-center px-8 py-12 rounded-3xl max-w-md mx-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
      >
        {/* 404 number */}
        <div className="relative mb-6">
          <div
            className="text-9xl font-black tracking-tighter select-none"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(79,70,229,0.4))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            404
          </div>
          <div
            className="absolute inset-0 text-9xl font-black tracking-tighter select-none blur-2xl opacity-30"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            404
          </div>
        </div>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <Compass className="w-8 h-8" style={{ color: "#a78bfa" }} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          Sorry, the page you are looking for doesn't exist. It may have been moved or deleted.
        </p>

        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>
    </div>
  );
}
