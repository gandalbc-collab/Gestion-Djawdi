import { describe, expect, it } from "vitest";
import { isAppleMobileDevice } from "../client/src/lib/pwa";

describe("PWA platform guidance", () => {
  it("selects the Safari home-screen instructions for iPhone and iPad", () => {
    expect(isAppleMobileDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 0)).toBe(true);
    expect(isAppleMobileDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", 0)).toBe(true);
    expect(isAppleMobileDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8)", 0)).toBe(false);
  });

  it("recognizes iPadOS desktop mode through touch capability", () => {
    expect(isAppleMobileDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 5)).toBe(true);
    expect(isAppleMobileDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 0)).toBe(false);
  });
});
