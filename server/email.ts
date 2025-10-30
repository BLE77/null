import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export function generateTrackingToken(): string {
  const randomChars = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  return `OFF-${randomChars()}-${randomChars()}`;
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
  nftTransfers?: Array<{
    productName: string;
    signature: string;
    explorerUrl: string;
  }>;
}

export async function sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<void> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const networkDisplay = orderData.network === 'base' ? 'Base' : 'Solana';
    
    const itemsList = orderData.items.map(item => 
      `${item.name} - Size ${item.size} × ${item.quantity} = $${(parseFloat(item.price) * item.quantity).toFixed(2)}`
    ).join('\n');
    
    const filesList = orderData.productFiles.map(file => {
      const files = [];
      if (file.glbUrl) {
        files.push(`• 3D Model (GLB): ${file.glbUrl}`);
      }
      files.push(`• Thumbnail (PNG): ${file.thumbnailUrl}`);
      return `${file.name}:\n${files.join('\n')}`;
    }).join('\n\n');
    
    const nftSection = orderData.nftTransfers && orderData.nftTransfers.length > 0 ? orderData.nftTransfers.map(nft => 
      `${nft.productName}:\n• View on Explorer: ${nft.explorerUrl}`
    ).join('\n\n') : '';
    
    const downloadUrl = `${process.env.REPLIT_DOMAINS}/api/orders/download/${orderData.trackingToken}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #000;
      color: #00FF41;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #0a0a0a;
      border: 2px solid #00FF41;
      padding: 30px;
    }
    h1 {
      color: #00FF41;
      text-transform: uppercase;
      letter-spacing: 3px;
      text-shadow: 0 0 10px #00FF41;
      margin-bottom: 20px;
    }
    .tracking-token {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
      background: #00FF41;
      padding: 15px;
      text-align: center;
      letter-spacing: 2px;
      margin: 20px 0;
      box-shadow: 0 0 20px #00FF41;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      border-left: 3px solid #00FF41;
    }
    .section-title {
      color: #00FF41;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .download-btn {
      display: inline-block;
      background: #00FF41;
      color: #000;
      padding: 15px 30px;
      text-decoration: none;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 20px 0;
      box-shadow: 0 0 20px #00FF41;
      transition: all 0.3s;
    }
    .download-btn:hover {
      box-shadow: 0 0 30px #00FF41;
      transform: scale(1.05);
    }
    .transaction {
      word-break: break-all;
      font-size: 12px;
      color: #888;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #00FF41;
      text-align: center;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ OFF HUMAN ⚡</h1>
    <p>Thank you for your purchase! Your digital products are ready for download.</p>
    
    <div class="tracking-token">${orderData.trackingToken}</div>
    <p style="text-align: center; font-size: 12px; color: #888;">Save this tracking token for your records</p>
    
    <div class="section">
      <div class="section-title">Order Details</div>
      <div style="white-space: pre-line;">${itemsList}</div>
      <div style="margin-top: 10px;"><strong>Total: $${orderData.totalAmount}</strong></div>
    </div>
    
    <div class="section">
      <div class="section-title">Payment Confirmed</div>
      <div>Network: ${networkDisplay}</div>
      <div class="transaction">Transaction: ${orderData.transactionHash}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Your Digital Products</div>
      <div style="white-space: pre-line;">${filesList}</div>
    </div>
    ${nftSection ? `
    <div class="section">
      <div class="section-title">🎨 Solana NFTs Delivered</div>
      <div style="white-space: pre-line;">${nftSection}</div>
      <p style="font-size: 12px; color: #888; margin-top: 10px;">NFTs have been transferred to your wallet: Check your Phantom/Backpack wallet!</p>
    </div>
    ` : ''}
    <div style="text-align: center;">
      <a href="${downloadUrl}" class="download-btn">Download All Files</a>
    </div>
    
    <div class="footer">
      <p>OFF HUMAN - Streetwear for the Singularity</p>
      <p>Keep your tracking token to re-download your files anytime</p>
    </div>
  </div>
</body>
</html>
    `;
    
    const textContent = `
OFF HUMAN - ORDER CONFIRMATION

Thank you for your purchase!

TRACKING TOKEN: ${orderData.trackingToken}
(Save this for your records)

ORDER DETAILS:
${itemsList}
Total: $${orderData.totalAmount}

PAYMENT CONFIRMED:
Network: ${networkDisplay}
Transaction: ${orderData.transactionHash}

YOUR DIGITAL PRODUCTS:
${filesList}
${nftSection ? `\n\nSOLANA NFTs DELIVERED:\n${nftSection}\nNFTs have been transferred to your wallet - check your Phantom/Backpack wallet!` : ''}

DOWNLOAD LINK:
${downloadUrl}

---
OFF HUMAN - Streetwear for the Singularity
Keep your tracking token to re-download your files anytime
    `;
    
    await client.emails.send({
      from: fromEmail,
      to: orderData.customerEmail,
      subject: `OFF HUMAN Order ${orderData.trackingToken} - Digital Products Ready`,
      html: htmlContent,
      text: textContent,
    });
    
    console.log(`[Email] Order confirmation sent to ${orderData.customerEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send order confirmation:', error);
    throw error;
  }
}
