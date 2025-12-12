import { describe, it, expect } from "vitest";
import { sanitizeFileName } from "../../src/utils/strings";

describe("sanitizeFileName", () => {
  it("removes forbidden characters and trims spaces", () => {
    const input = `  re:port*/\\?<>|  name  `;
    const out = sanitizeFileName(input);
    expect(out).toBe("re-port-name");
  });

  it("collapses multiple spaces", () => {
    const input = "My    Fancy     Report";
    const out = sanitizeFileName(input);
    expect(out).toBe("My-Fancy-Report");
  });

  it("keeps normal names intact", () => {
    const input = "Quarterly Report 2025";
    const out = sanitizeFileName(input);
    expect(out).toBe("Quarterly-Report-2025");
  });
});


