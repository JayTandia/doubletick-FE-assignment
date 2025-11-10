import { Dexie } from "dexie";

// Initialize IndexedDB database
export const db = new Dexie("customerDB");
db.version(1).stores({
  customers: "++id, name, email, phone, score, lastMessageAt, addedBy",
});

// Fetch customers with search, sort, and pagination support
export async function fetchCustomers({
  offset = 0,
  limit = 30,
  sortConfig,
  searchTerm,
}) {
  let collection;
  const st = searchTerm ? searchTerm.toLowerCase() : null;
  let totalCount;

  if (st) {
    // Search mode: filter by name, email, or phone (case-insensitive)
    collection = db.customers
      .where("name")
      .startsWithIgnoreCase(st)
      .or("email")
      .startsWithIgnoreCase(st)
      .or("phone")
      .startsWithIgnoreCase(st);

    totalCount = await collection.count();
  } else {
    // Sort mode: order by specified column
    collection = db.customers.orderBy(sortConfig.key);

    if (sortConfig.direction === "desc") {
      collection = collection.reverse();
    }

    // Return -1 to indicate total count should be fetched separately
    totalCount = -1;
  }

  // Apply pagination and fetch data
  const data = await collection.offset(offset).limit(limit).toArray();

  return { data, totalCount };
}
