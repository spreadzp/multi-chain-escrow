import { Keypair } from "@stellar/stellar-sdk";
import * as fs from "fs";
import * as path from "path";

export interface StellarKeyPair {
  role: string;
  publicKey: string;
  secretKey: string;
}

export function loadStellarKeypair(role: string): StellarKeyPair {
  const filePath = path.join(
    process.cwd(),
    "..",
    "blockchains",
    "stellar",
    ".local-keys",
    `${role}.json`,
  );
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return {
    role: data.role,
    publicKey: data.publicKey,
    secretKey: data.secretKey,
  };
}
