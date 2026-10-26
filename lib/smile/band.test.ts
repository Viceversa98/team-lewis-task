import { describe, expect, it } from "vitest";
import { smileBand } from "@/lib/smile/band";

describe("smile band", () => {
  it("names each quarter of the 0-100 range", () => {
    expect(smileBand(0)).toBe("No smile");
    expect(smileBand(24)).toBe("No smile");
    expect(smileBand(25)).toBe("Slight smile");
    expect(smileBand(49)).toBe("Slight smile");
    expect(smileBand(50)).toBe("Clear smile");
    expect(smileBand(74)).toBe("Clear smile");
    expect(smileBand(75)).toBe("Broad smile");
    expect(smileBand(100)).toBe("Broad smile");
  });
});
