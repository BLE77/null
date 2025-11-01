import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";
import { list, del, put } from "@vercel/blob";
import { config } from "dotenv";

config();

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN in environment");
  process.exit(1);
}

const LOCAL_DIR = join(process.cwd(), "attached_assets");
const REMOTE_PREFIX = "uploads/";

function collectLocalFiles(dir: string, base = ""): Map<string, string> {
  const entries = readdirSync(dir);
  const map = new Map<string, string>();
  for (const entry of entries) {
    const full = join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const stats = statSync(full);
    if (stats.isDirectory()) {
      for (const [k, v] of collectLocalFiles(full, rel)) {
        map.set(k, v);
      }
    } else {
      map.set(rel.replace(/\\/g, "/"), full);
    }
  }
  return map;
}

async function main() {
  console.log("Listing remote blobs…");
  const remote = await list({ token: BLOB_TOKEN, prefix: REMOTE_PREFIX });
  const remoteSet = new Set(remote.blobs.map((b) => b.pathname.replace(`${REMOTE_PREFIX}`, "")));

  console.log(`Found ${remoteSet.size} remote blobs under ${REMOTE_PREFIX}`);

  console.log("Collecting local assets…");
  const localMap = collectLocalFiles(LOCAL_DIR);
  console.log(`Found ${localMap.size} local files in attached_assets/`);

  // Delete remote files that no longer exist locally
  for (const remotePath of remoteSet) {
    if (!localMap.has(remotePath)) {
      const blobPath = `${REMOTE_PREFIX}${remotePath}`;
      console.log(`Deleting remote blob ${blobPath}`);
      await del(blobPath, { token: BLOB_TOKEN });
    }
  }

  // Upload local files that are missing remotely
  for (const [relPath, fullPath] of localMap) {
    if (!remoteSet.has(relPath)) {
      const blobPath = `${REMOTE_PREFIX}${relPath}`;
      console.log(`Uploading ${relPath} to ${blobPath}`);
      const data = readFileSync(fullPath);
      await put(blobPath, data, { token: BLOB_TOKEN, access: "public" });
    }
  }

  console.log("Sync complete.");
}

main().catch((err) => {
  console.error("Failed to sync blob storage", err);
  process.exit(1);
});
