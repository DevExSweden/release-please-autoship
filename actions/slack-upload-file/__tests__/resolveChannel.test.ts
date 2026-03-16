import { describe, it, expect, vi } from "vitest";
import { resolveChannelId } from "../src/resolveChannel";
import { WebClient } from "@slack/web-api";

function createMockClient(channels: Array<{ id: string; name: string; name_normalized?: string }>) {
  const client = {
    conversations: {
      list: vi.fn().mockResolvedValue({
        ok: true,
        channels,
        response_metadata: { next_cursor: "" },
      }),
    },
  } as unknown as WebClient;
  return client;
}

function createPaginatedMockClient(
  pages: Array<Array<{ id: string; name: string; name_normalized?: string }>>
) {
  let callCount = 0;
  const client = {
    conversations: {
      list: vi.fn().mockImplementation((opts: { cursor?: string }) => {
        const page = pages[callCount] ?? [];
        callCount++;
        const hasMore = callCount < pages.length;
        return Promise.resolve({
          ok: true,
          channels: page,
          response_metadata: {
            next_cursor: hasMore ? "next" : "",
          },
        });
      }),
    },
  } as unknown as WebClient;
  return client;
}

describe("resolveChannelId", () => {
  it("returns channel ID when matched by ID", async () => {
    const client = createMockClient([
      { id: "C01234567", name: "releases", name_normalized: "releases" },
    ]);
    const result = await resolveChannelId(client, "C01234567");
    expect(result).toBe("C01234567");
  });

  it("returns channel ID when matched by name", async () => {
    const client = createMockClient([
      { id: "C01234567", name: "releases", name_normalized: "releases" },
    ]);
    const result = await resolveChannelId(client, "releases");
    expect(result).toBe("C01234567");
  });

  it("returns channel ID when matched by name with # prefix", async () => {
    const client = createMockClient([
      { id: "C01234567", name: "releases", name_normalized: "releases" },
    ]);
    const result = await resolveChannelId(client, "#releases");
    expect(result).toBe("C01234567");
  });

  it("returns channel ID when matched by name_normalized", async () => {
    const client = createMockClient([
      { id: "C09999999", name: "Release-Channel", name_normalized: "release-channel" },
    ]);
    const result = await resolveChannelId(client, "release-channel");
    expect(result).toBe("C09999999");
  });

  it("trims whitespace from input", async () => {
    const client = createMockClient([
      { id: "C01234567", name: "releases", name_normalized: "releases" },
    ]);
    const result = await resolveChannelId(client, "  releases  ");
    expect(result).toBe("C01234567");
  });

  it("finds channel in second page when paginating", async () => {
    const client = createPaginatedMockClient([
      [
        { id: "C11111111", name: "general", name_normalized: "general" },
        { id: "C22222222", name: "random", name_normalized: "random" },
      ],
      [
        { id: "C33333333", name: "releases", name_normalized: "releases" },
      ],
    ]);
    const result = await resolveChannelId(client, "releases");
    expect(result).toBe("C33333333");
  });

  it("throws when channel not found", async () => {
    const client = createMockClient([
      { id: "C01234567", name: "general", name_normalized: "general" },
    ]);
    await expect(resolveChannelId(client, "nonexistent")).rejects.toThrow(
      "Channel not found: nonexistent"
    );
  });

  it("throws when API returns error", async () => {
    const client = {
      conversations: {
        list: vi.fn().mockResolvedValue({ ok: false, error: "invalid_auth" }),
      },
    } as unknown as WebClient;
    await expect(resolveChannelId(client, "releases")).rejects.toThrow(
      "invalid_auth"
    );
  });
});
