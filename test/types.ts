// Compile-only checks for the published declarations (run by `npm run typecheck`).
import GenderAPIDefault, {
  GenderAPI,
  GenderAPIHTTPError,
  failedItems,
  type BatchResponse,
  type GenderResponse,
  type Prediction,
} from "../dist/esm/index.js";

async function usage(): Promise<void> {
  const client: GenderAPI = new GenderAPIDefault({ apiKey: null, timeoutMs: 5000 });
  const single: GenderResponse = await client.name("Andrea", { country: "IT", aiMode: "off" });
  const gender: "male" | "female" | null = single.data.gender;
  const confidence: number | null = single.data.confidence;
  const status: "not_charged" | "confirmed" | "unconfirmed" = single.meta.usage.billing_status;
  await client.gender({ type: "email", value: "alex@example.com", options: { ai_mode: "fallback" } });
  await client.gender("username", "prenses", { forceToGenderize: true });
  const batch: BatchResponse = await client.genderBatch([{ id: "1", type: "name", value: "Ada" }]);
  for (const row of batch.data) {
    if (row.error) {
      const code: string = row.error.code;
      void code;
    } else {
      const p: Prediction = row.data;
      void p;
    }
  }
  failedItems(batch).map((row) => row.error.code);
  await client.usage();
  await client.validatePhone("+15550100000");
  try {
    await client.name("Ada");
  } catch (error) {
    if (error instanceof GenderAPIHTTPError) {
      const s: number = error.status;
      const retry: number | null = error.retryAfter;
      void s;
      void retry;
    }
  }
  // @ts-expect-error invalid input type
  await client.gender("phone", "x");
  void gender;
  void confidence;
  void status;
}
void usage;
