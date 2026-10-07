import { useSyncExternalStore } from "react";

export type Role = "seller" | "buyer";

let role: Role = "seller";
let loaded = false;
const subscribers = new Set<() => void>();

function loadRole() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  role = localStorage.getItem("sentiment-role") === "buyer" ? "buyer" : "seller";
}

export function setRole(nextRole: Role) {
  loadRole();
  role = nextRole;
  if (typeof window !== "undefined") {
    localStorage.setItem("sentiment-role", role);
  }
  subscribers.forEach((subscriber) => subscriber());
}

export function useRole() {
  return useSyncExternalStore(
    (subscriber) => {
      subscribers.add(subscriber);
      if (!loaded) {
        loadRole();
        subscriber();
      }
      return () => subscribers.delete(subscriber);
    },
    () => role,
    () => "seller",
  );
}
