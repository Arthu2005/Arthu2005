import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";

/**
 * Storage abstraction. Two drivers:
 *  - local: files on disk OUTSIDE /public (never served directly; only via authorised route handlers)
 *  - s3:    any S3-compatible bucket (Supabase Storage S3, Cloudflare R2, AWS S3, MinIO). Bucket must be PRIVATE.
 */
export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

function safeKey(key: string) {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) throw new Error("Chave de arquivo inválida");
  return key;
}

class LocalDriver implements StorageDriver {
  private root = path.resolve(env.STORAGE_LOCAL_DIR);
  private full(key: string) {
    const p = path.resolve(this.root, safeKey(key));
    if (!p.startsWith(this.root + path.sep)) throw new Error("Caminho inválido");
    return p;
  }
  async put(key: string, data: Buffer) {
    const p = this.full(key);
    await fs.mkdir(path.dirname(p), { recursive: true, mode: 0o700 });
    await fs.writeFile(p, data, { mode: 0o600 });
  }
  async get(key: string) {
    try {
      return await fs.readFile(this.full(key));
    } catch {
      return null;
    }
  }
  async remove(key: string) {
    await fs.rm(this.full(key), { force: true });
  }
}

class S3Driver implements StorageDriver {
  private clientPromise = (async () => {
    const { S3Client } = await import("@aws-sdk/client-s3");
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error("STORAGE_DRIVER=s3 requer S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY");
    }
    return new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    });
  })();
  async put(key: string, data: Buffer, contentType: string) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const c = await this.clientPromise;
    await c.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: safeKey(key), Body: data, ContentType: contentType }));
  }
  async get(key: string) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const c = await this.clientPromise;
    try {
      const res = await c.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: safeKey(key) }));
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch {
      return null;
    }
  }
  async remove(key: string) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const c = await this.clientPromise;
    await c.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: safeKey(key) }));
  }
}

let driver: StorageDriver | null = null;
export function storage(): StorageDriver {
  if (!driver) driver = env.STORAGE_DRIVER === "s3" ? new S3Driver() : new LocalDriver();
  return driver;
}
