import { config } from "dotenv";
import pg from "pg";

const { Client } = pg;

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Aborting update.");
  process.exit(1);
}

const updates = [
  {
    id: "d714f2de-0a95-40c9-ada8-858bd67141ab",
    name: "Byte Me",
    image_url: "/attached_assets/Byte%20Me_1761640131026.png",
    home_page_image_url: "/attached_assets/Byte%20Me_1761640131026.png",
    shop_image_url: "/attached_assets/fit%201_1761538225955.png",
    images: [
      "/attached_assets/Byte%20Me_1761640131026.png",
      "/attached_assets/fit%201_1761538260908.png",
    ],
    model_url: "/attached_assets/THG_1761649401547.glb",
  },
  {
    id: "2cf97712-a6c9-4fc5-9127-de64118f4e2b",
    name: "CLANKERS TOKYO",
    image_url:
      "/attached_assets/ChatGPT%20Image%20Oct%2025,%202025,%2004_49_09%20PM_1761436509620.png",
    home_page_image_url:
      "/attached_assets/ChatGPT%20Image%20Oct%2025,%202025,%2004_49_09%20PM_1761436509620.png",
    shop_image_url: "/attached_assets/fit%202a_1761538225956.png",
    images: [
      "/attached_assets/ChatGPT%20Image%20Oct%2025,%202025,%2004_49_09%20PM_1761436509620.png",
      "/attached_assets/fit%202a_1761538260906.png",
    ],
    model_url: "/attached_assets/Clanker%20Tokyo_1761610501240.glb",
  },
  {
    id: "77fc7ace-8b29-402a-a85e-ba6544bb8af3",
    name: "X402 tie",
    image_url: "/attached_assets/fit%203a_1761538225956.png",
    home_page_image_url: "/attached_assets/fit%203a_1761538225956.png",
    shop_image_url: "/attached_assets/fit%203a_1761538260907.png",
    images: [
      "/attached_assets/fit%203a_1761538225956.png",
      "/attached_assets/fit%203a_1761538260907.png",
    ],
    model_url: null,
  },
  {
    id: "a80d802e-a045-4dc1-aa83-bde612c90760",
    name: "X402 CALL TEE",
    image_url: "/attached_assets/402%20call_1761436644815.png",
    home_page_image_url: "/attached_assets/402%20call_1761436644815.png",
    shop_image_url: "/attached_assets/fit%204a_1761538225956.png",
    images: [
      "/attached_assets/402%20call_1761436644815.png",
      "/attached_assets/fit%204a_1761538260907.png",
    ],
    model_url: null,
  },
  {
    id: "e9e21d8e-7ff2-473d-bd6e-cc565c003195",
    name: "CLANKERS BMX HOODIE",
    image_url: "/attached_assets/clankersar_1761436647628.png",
    home_page_image_url: "/attached_assets/clankersar_1761436647628.png",
    shop_image_url: "/attached_assets/fit%205_1761538225956.png",
    images: [
      "/attached_assets/clankersar_1761436647628.png",
      "/attached_assets/fit%205_1761538260907.png",
    ],
    model_url: "/attached_assets/Clanker%20Tokyo_1761611854063.glb",
  },
  {
    id: "3f1535f9-ec50-4c0f-8509-ba2f29d607b0",
    name: "PROVE YOU'RE NOT HUMAN",
    image_url:
      "/attached_assets/ChatGPT%20Image%20Oct%2027,%202025,%2008_39_39%20PM_1761622826007.png",
    home_page_image_url:
      "/attached_assets/ChatGPT%20Image%20Oct%2027,%202025,%2008_39_39%20PM_1761622826007.png",
    shop_image_url: "/attached_assets/fit%208_1761538225957.png",
    images: [
      "/attached_assets/ChatGPT%20Image%20Oct%2027,%202025,%2008_39_39%20PM_1761622826007.png",
      "/attached_assets/fit%208_1761538260907.png",
    ],
    model_url: "/attached_assets/Aura%201_1761649401549.glb",
  },
];

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    for (const update of updates) {
      const { id, name, image_url, home_page_image_url, shop_image_url, images, model_url } = update;

      await client.query(
        `UPDATE products
         SET image_url = $1,
             home_page_image_url = $2,
             shop_image_url = $3,
             images = $4,
             model_url = $5
         WHERE id = $6`,
        [image_url, home_page_image_url, shop_image_url, images, model_url, id],
      );

      console.log(`Updated product '${name}' (${id})`);
    }

    console.log("All product assets updated.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed to update product assets", err);
  process.exit(1);
});
