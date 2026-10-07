import { setRole, useRole } from "@/lib/store";

export function RoleSwitch() {
  const role = useRole();
  const buyer = role === "buyer";
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <span className={`font-mono text-xs uppercase tracking-wider ${!buyer ? "text-foreground" : "text-muted-foreground"}`}>Seller</span>
        <button
          role="switch"
          aria-checked={buyer}
          aria-label="Switch between seller and buyer"
          onClick={() => setRole(buyer ? "seller" : "buyer")}
          className={`relative h-6 w-11 rounded-full transition-colors ${buyer ? "bg-positive" : "bg-primary"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${buyer ? "left-[22px]" : "left-0.5"}`} />
        </button>
        <span className={`font-mono text-xs uppercase tracking-wider ${buyer ? "text-foreground" : "text-muted-foreground"}`}>Buyer</span>
      </div>
    </header>
  );
}
