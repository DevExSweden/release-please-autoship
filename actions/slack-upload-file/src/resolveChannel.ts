import { WebClient } from "@slack/web-api";

/**
 * Resolve channel to ID via conversations.list. Matches by channel ID or name.
 */
export async function resolveChannelId(
  client: WebClient,
  channel: string
): Promise<string> {
  const trimmed = channel.trim();
  const searchName = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  let cursor: string | undefined;

  do {
    const response = await client.conversations.list({
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });

    if (!response.ok || !response.channels) {
      throw new Error(
        response.error ?? "Failed to list channels for name resolution"
      );
    }

    for (const ch of response.channels) {
      if (ch.id === trimmed) return ch.id;
      const name = ch.name ?? "";
      const nameNormalized = (ch as any).name_normalized ?? name;
      if (
        name === searchName ||
        nameNormalized === searchName ||
        name === searchName.toLowerCase() ||
        nameNormalized === searchName.toLowerCase()
      ) {
        return ch.id!;
      }
    }

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);

  throw new Error(`Channel not found: ${channel}`);
}
