import { Dexie } from "dexie";
import { faker } from "@faker-js/faker";

// Initialize IndexedDB in worker thread
const db = new Dexie("customerDB");
db.version(1).stores({
  customers: "++id, name, email, phone, score, lastMessageAt, addedBy",
});

// Generate a random customer object with fake data
function createRandomCustomer() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    score: faker.number.int({ min: 0, max: 100 }),
    lastMessageAt: faker.date.recent({ days: 30 }).toISOString(),
    addedBy: faker.person.firstName(),
    avatar: faker.image.avatar(),
  };
}

// Listen for messages from main thread
self.addEventListener("message", async (event) => {
  if (event.data.command === "generate") {
    try {
      await db.open();

      // Configuration constants
      const CHUNK_SIZE = 30;
      const TOTAL_RECORDS = 1000000;

      const count = await db.customers.count();

      // Skip generation if target count already reached
      if (count >= TOTAL_RECORDS) {
        postMessage({ status: "complete", newCount: count });
        return;
      }

      // Generate records in chunks to avoid blocking
      for (let i = count; i < TOTAL_RECORDS; i += CHUNK_SIZE) {
        const customers = [];
        const batchSize = Math.min(CHUNK_SIZE, TOTAL_RECORDS - i);
        // Create batch of random customers
        for (let j = 0; j < batchSize; j++) {
          customers.push(createRandomCustomer());
        }

        // Bulk insert batch into database
        await db.customers.bulkAdd(customers);

        // Send progress update to main thread
        const newCount = i + batchSize;
        postMessage({ status: "progress", newCount: newCount });
      }

      // Signal completion
      postMessage({ status: "complete", newCount: TOTAL_RECORDS });
    } catch (error) {
      postMessage({ status: "error", message: error.message });
    }
  }
});
