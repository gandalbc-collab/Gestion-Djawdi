import { useState } from "react";

export function useCurrentMonth() {
  const now = new Date();
  const [month, setMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  return { month, setMonth };
}
