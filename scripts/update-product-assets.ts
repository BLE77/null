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
    image_url: "/attached_assets/ProdByte.png",
    home_page_image_url: "/attached_assets/StreetCall.png",
    shop_image_url: "/attached_assets/RobotByte.png",
    images: [
      "/attached_assets/ProdByte.png",
      "/attached_assets/RobotByte.png",
    ],
    model_url: "/attached_assets/GLBByte.glb",
  },
  {
    id: "2cf97712-a6c9-4fc5-9127-de64118f4e2b",
    name: "CLANKERS TOKYO",
    image_url: "/attached_assets/ProdTokyo.png",
    home_page_image_url: "/attached_assets/StreetTokyo.mp4",
    shop_image_url: "/attached_assets/RobotTokyo.png",
    images: [
      "/attached_assets/ProdTokyo.png",
      "/attached_assets/RobotTokyo.png",
    ],
    model_url: "/attached_assets/GLBTokyo.glb",
  },
  {
    id: "77fc7ace-8b29-402a-a85e-ba6544bb8af3",
    name: "X402 tie",
    image_url: "/attached_assets/ProdTie.png",
    home_page_image_url: "/attached_assets/StreetTie.mp4",
    shop_image_url: "/attached_assets/RobotTie.png",
    images: [
      "/attached_assets/ProdTie.png",
      "/attached_assets/RobotTie.png",
    ],
    model_url: "/attached_assets/GLBTie.glb",
  },
  {
    id: "a80d802e-a045-4dc1-aa83-bde612c90760",
    name: "X402 CALL TEE",
    image_url: "/attached_assets/ProdCall.png",
    home_page_image_url: "/attached_assets/StreetCall2.png",
    shop_image_url: "/attached_assets/RobotCall.png",
    images: [
      "/attached_assets/ProdCall.png",
      "/attached_assets/RobotCall.png",
    ],
    model_url: "/attached_assets/GLBCall.glb",
  },
  {
    id: "e9e21d8e-7ff2-473d-bd6e-cc565c003195",
    name: "CLANKERS BMX HOODIE",
    image_url: "/attached_assets/ProdGTA.png",
    home_page_image_url: "/attached_assets/StreetGTA.png",
    shop_image_url: "/attached_assets/RobotGTA.png",
    images: [
      "/attached_assets/ProdGTA.png",
      "/attached_assets/RobotGTA.png",
    ],
    model_url: "/attached_assets/GLBGTA.glb",
  },
  {
    id: "3f1535f9-ec50-4c0f-8509-ba2f29d607b0",
    name: "PROVE YOU'RE NOT HUMAN",
    image_url: "/attached_assets/ProdProve.png",
    home_page_image_url: "/attached_assets/StreetCall.png",
    shop_image_url: "/attached_assets/RobotProve.png",
    images: [
      "/attached_assets/ProdProve.png",
      "/attached_assets/RobotProve.png",
    ],
    model_url: "/attached_assets/GLBProve.glb",
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
