import { dbStorage } from "./db-storage";

async function seed() {
  try {
    console.log("Seeding database...");
    await dbStorage.seedProducts();
    console.log("✓ Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
