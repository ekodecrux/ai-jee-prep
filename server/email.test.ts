import { describe, it, expect } from "vitest";
import { testSmtpConnection } from "./email";

describe("SMTP Email Service", () => {
  it("connects to Gmail SMTP successfully", async () => {
    const result = await testSmtpConnection();
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error("SMTP error:", result.error);
    }
  }, 15000);
});
