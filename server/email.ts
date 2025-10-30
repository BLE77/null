import { Resend } from "resend";

export function generateTrackingToken(): string {
  const randomChars = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `OFF-${randomChars()}-${randomChars()}`;
}

function getSiteUrl(): string {
  const fromEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:5000";
}

async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM || process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error(
      "Missing RESEND_API_KEY or RESEND_FROM/FROM_EMAIL env vars for email sending.",
    );
  }
  return { client: new Resend(apiKey), fromEmail };
}

interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: string;
}

interface OrderEmailData {
  customerEmail: string;
  trackingToken: string;
  network: string;
  transactionHash: string;
  items: OrderItem[];
  totalAmount: string;
  productFiles: {
    productId: string;
    name: string;
    glbUrl?: string;
    thumbnailUrl: string;
  }[];
}

export async function sendOrderConfirmationEmail(
  orderData: OrderEmailData,
): Promise<void> {
  const { client, fromEmail } = await getResendClient();
  const networkDisplay = orderData.network === "base" ? "Base" : "Solana";
  const itemsList = orderData.items
    .map(
      (item) =>
        `${item.name} - Size ${item.size} × ${item.quantity} = $${(
          parseFloat(item.price) * item.quantity
        ).toFixed(2)}`,
    )
    .join("\n");

  const filesList = orderData.productFiles
    .map((file) => {
      const files: string[] = [];
      if (file.glbUrl) files.push(`• 3D Model (GLB): ${file.glbUrl}`);
      files.push(`• Thumbnail (PNG): ${file.thumbnailUrl}`);
      return `${file.name}:\n${files.join("\n")}`;
    })
    .join("\n\n");

  const downloadUrl = `${getSiteUrl()}/api/orders/download/${orderData.trackingToken}`;

  const htmlContent = `<!DOCTYPE html>
<html><head><style>
  body { font-family: 'Courier New', monospace; background:#000; color:#00FF41; padding:20px; line-height:1.6; }
  .container { max-width:600px; margin:0 auto; background:#0a0a0a; border:2px solid #00FF41; padding:30px; }
  h1 { color:#00FF41; text-transform:uppercase; letter-spacing:3px; text-shadow:0 0 10px #00FF41; margin-bottom:20px; }
  .tracking-token { font-size:24px; font-weight:bold; color:#000; background:#00FF41; padding:15px; text-align:center; letter-spacing:2px; margin:20px 0; box-shadow:0 0 20px #00FF41; }
  .section { margin:20px 0; padding:15px; border-left:3px solid #00FF41; }
  .section-title { color:#00FF41; font-weight:bold; text-transform:uppercase; margin-bottom:10px; }
  .download-btn { display:inline-block; background:#00FF41; color:#000; padding:15px 30px; text-decoration:none; font-weight:bold; text-transform:uppercase; letter-spacing:2px; margin:20px 0; box-shadow:0 0 20px #00FF41; transition: all .3s; }
  .download-btn:hover { box-shadow: 0 0 30px #00FF41; transform: scale(1.05); }
  .transaction { word-break:break-all; font-size:12px; color:#888; }
</style></head>
<body><div class="container">
  <h1>OFF HUMAN</h1>
  <p>Thank you for your purchase! Your digital products are ready for download.</p>
  <div class="tracking-token">${orderData.trackingToken}</div>
  <div class="section"><div class="section-title">Order Details</div>
    <div style="white-space: pre-line;">${itemsList}</div>
    <div style="margin-top:10px;"><strong>Total: $${orderData.totalAmount}</strong></div>
  </div>
  <div class="section"><div class="section-title">Payment Confirmed</div>
    <div>Network: ${networkDisplay}</div>
    <div class="transaction">Transaction: ${orderData.transactionHash}</div>
  </div>
  <div class="section"><div class="section-title">Your Digital Products</div>
    <div style="white-space: pre-line;">${filesList}</div>
  </div>
  <div style="text-align:center;"><a href="${downloadUrl}" class="download-btn">Download All Files</a></div>
</div></body></html>`;

  const textContent = `OFF HUMAN - ORDER CONFIRMATION\n\nThank you for your purchase!\n\nTRACKING TOKEN: ${
    orderData.trackingToken
  }\n(Save this for your records)\n\nORDER DETAILS:\n${itemsList}\nTotal: $$${
    orderData.totalAmount
  }\n\nPAYMENT CONFIRMED:\nNetwork: ${networkDisplay}\nTransaction: ${
    orderData.transactionHash
  }\n\nYOUR DIGITAL PRODUCTS:\n${filesList}\n\nDOWNLOAD LINK:\n${downloadUrl}\n\n---\nOFF HUMAN - Streetwear for the Singularity\nKeep your tracking token to re-download your files anytime`;

  await client.emails.send({
    from: fromEmail,
    to: orderData.customerEmail,
    subject: `OFF HUMAN Order ${orderData.trackingToken} - Digital Products Ready`,
    html: htmlContent,
    text: textContent,
  });
  console.log(`[Email] Order confirmation sent to ${orderData.customerEmail}`);
}

