import { Client } from "@elastic/elasticsearch";

// Single ES client for the whole app. Local dev points at the docker
// elasticsearch service; production points at the existing Contabo ES.
const node = process.env.ELASTICSEARCH_URL || "http://localhost:9200";

const globalForEs = globalThis as unknown as { __esClient?: Client };

export const es =
  globalForEs.__esClient ??
  new Client({
    node,
    auth: process.env.ELASTICSEARCH_API_KEY
      ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
      : process.env.ELASTICSEARCH_USERNAME
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD || "",
          }
        : undefined,
    // Local single-node dev runs with security off; prod uses TLS + creds.
    tls: process.env.ELASTICSEARCH_INSECURE_TLS
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForEs.__esClient = es;
