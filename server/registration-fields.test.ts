import { describe, expect, it } from "vitest";
import { registrationSchema } from "./routers";

describe("registration mandatory contact fields", () => {
  const validData = {
    fullName: "Aminata Diallo",
    phone: "+224 620 00 00 00",
    city: "Conakry",
  };

  it("accepts a complete registration profile", () => {
    expect(registrationSchema.safeParse(validData).success).toBe(true);
  });

  it("rejects missing, blank, or malformed contact details", () => {
    expect(registrationSchema.safeParse({ ...validData, phone: "" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validData, phone: "contactez-moi" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validData, city: " " }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validData, fullName: "A" }).success).toBe(false);
  });
});
