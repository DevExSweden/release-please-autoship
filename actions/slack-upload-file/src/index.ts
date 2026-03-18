import * as core from "@actions/core";
import { WebClient } from "@slack/web-api";
import * as fs from "fs";
import * as path from "path";
import { resolveChannelId } from "./resolveChannel";

async function run(): Promise<void> {
  try {
    const token = core.getInput("slack_token", { required: true });
    const channelName = core.getInput("channel", { required: true });
    const filePath = core.getInput("file_path", { required: true });
    const fileNameInput = core.getInput("file_name") || "";
    const initialComment = core.getInput("initial_comment") || "";
    const title = core.getInput("title") || "";

    const resolved = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File not found at path: ${resolved}`);
    }

    const fileBuffer = fs.readFileSync(resolved);
    if (fileBuffer.length === 0) {
      throw new Error(
        `File is empty (0 bytes): ${resolved}. Slack rejects empty file uploads.`
      );
    }

    const client = new WebClient(token);
    const channelId = await resolveChannelId(client, channelName);

    const filename = fileNameInput || path.basename(resolved);

    const result = await client.files.uploadV2({
      channel_id: channelId,
      file: fileBuffer,
      filename,
      initial_comment: initialComment || undefined,
      title: title || undefined
    });

    // result.files may be an array; capture first file
    const uploadedFile: any = (result as any).files?.[0] || (result as any).file;
    const fileId = uploadedFile?.id || "";
    const permalink = uploadedFile?.permalink || "";
    core.setOutput("file_id", fileId);
    core.setOutput("permalink", permalink);
  } catch (err: any) {
    core.setFailed(err?.message ?? String(err));
  }
}

run();


