require("dotenv").config();
const express = require("express");
const bs58 = require("bs58");
const fetch = (...args) => import("node-fetch").then(({default: f}) => f(...args));
const {
  Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction,
} = require("@solana/web3.js");
const {
  getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction,
} = require("@solana/spl-token");

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const PORT = Number(process.env.PORT || 3000);
const X402_WEBHOOK_SECRET = process.env.X402_WEBHOOK_SECRET || "";
const VAULT_SECRET_KEY = process.env.VAULT_SECRET_KEY;
if (!VAULT_SECRET_KEY) throw new Error("Missing VAULT_SECRET_KEY");

const connection = new Connection(RPC_URL, "confirmed");
function loadVault(secret){try{return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));}catch{return Keypair.fromSecretKey(bs58.decode(secret));}}
const VAULT = loadVault(VAULT_SECRET_KEY);
const app = express(); app.use(express.json());

function ok(res, data){return res.json({ok:true,...data});}
function fail(res,code,msg){return res.status(code).json({ok:false,error:msg});}
function verifyX402(req){if(!X402_WEBHOOK_SECRET)return true; const sig=req.headers["x-x402-signature"]; return typeof sig==="string"&&sig===X402_WEBHOOK_SECRET;}

async function transferNft({recipient,mint,decimals=0}){
  const recipientPk=new PublicKey(recipient); const mintPk=new PublicKey(mint);
  const fromAta=await getAssociatedTokenAddress(mintPk,VAULT.publicKey,true);
  const toAta=await getAssociatedTokenAddress(mintPk,recipientPk,true);
  const ix=[]; const toInfo=await connection.getAccountInfo(toAta);
  if(!toInfo) ix.push(createAssociatedTokenAccountInstruction(VAULT.publicKey,toAta,recipientPk,mintPk));
  ix.push(createTransferCheckedInstruction(fromAta,mintPk,toAta,VAULT.publicKey,1,decimals));
  const tx=new Transaction().add(...ix); tx.feePayer=VAULT.publicKey;
  tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
  const sig=await sendAndConfirmTransaction(connection,tx,[VAULT],{commitment:"confirmed",skipPreflight:false});
  return sig;
}

app.get("/",(_req,res)=>ok(res,{status:"healthy",vault:VAULT.publicKey.toBase58()}));
app.post("/fulfill",async(req,res)=>{
  try{const{recipient,mint,decimals}=req.body||{};
  if(!recipient||!mint)return fail(res,400,"Missing recipient or mint");
  const sig=await transferNft({recipient,mint,decimals:decimals??0});
  ok(res,{signature:sig,explorer:`https://solscan.io/tx/${sig}`});}
  catch(e){console.error("Transfer error:",e);fail(res,500,e.message||"Transfer failed");}
});
app.post("/x402/webhook",async(req,res)=>{
  try{if(!verifyX402(req))return fail(res,401,"Invalid webhook signature");
  const event=req.body||{};
  if(!event.paid)return ok(res,{received:true,skipped:"not paid"});
  if(!event.recipient||!event.mint)return fail(res,400,"Missing recipient or mint in webhook");
  const sig=await transferNft({recipient:event.recipient,mint:event.mint,decimals:0});
  ok(res,{received:true,signature:sig,explorer:`https://solscan.io/tx/${sig}`});}
  catch(e){console.error("Webhook error:",e);fail(res,500,e.message||"Webhook failed");}
});
app.listen(PORT,()=>{console.log(`✅ Server running on :${PORT}`);console.log(`Vault: ${VAULT.publicKey.toBase58()}`);});