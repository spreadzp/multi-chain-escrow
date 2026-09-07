import type { ChainId } from "@/shared/types";

export interface ContractConfig {
  programId: string;
  contractId: string;
  tokenMint: string;
  resolverId: string;
}

// EPIC-06: Solana escrow program deployed to local validator
const solanaLocalContracts: ContractConfig = {
  programId: "BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj",
  contractId: "BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj",
  tokenMint: "TODO_SOLANA_LOCAL_TOKEN_MINT", // Set at runtime by EPIC-08 adapter (mint is created dynamically in tests)
  resolverId: "8Drae1LC1vvdxoi6ofH1TEnDdovHQUfM44X3rT6KmsJM", // Deployer key = resolver
};

// EPIC-11-1: Solana escrow program deployed to devnet
const solanaDevnetContracts: ContractConfig = {
  programId: "BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj",
  contractId: "BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj",
  tokenMint: "BSXLVemNjhY9TiT2pb5jmMhBYPHM1nrA8kadMNTT6Cxn",
  resolverId: "8Drae1LC1vvdxoi6ofH1TEnDdovHQUfM44X3rT6KmsJM",
};

const stellarLocalContracts: ContractConfig = {
  programId: "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS",
  contractId: "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS",
  tokenMint: "TODO_STELLAR_LOCAL_TOKEN_MINT", // Set at runtime by EPIC-09 adapter (SAC token created dynamically)
  resolverId: "GDXMWQDVZ5DORJFPIPUDFRML2OEPBMSG77J2TIIGWRIBSRWPT5EK2GG5", // Deployer key
};

// EPIC-11-2: Stellar escrow deployed to testnet
const stellarTestnetContracts: ContractConfig = {
  programId: "CA7LUBLVG3QOXHYRZH65R2QODJMNSMZU65TOC2ZRJFWYBCTFQOEMRM44",
  contractId: "CA7LUBLVG3QOXHYRZH65R2QODJMNSMZU65TOC2ZRJFWYBCTFQOEMRM44",
  tokenMint: "CC6PM5SSZIXX5U54T2D375HYMR6VXWR5B7GRVFNSV6JLO3LNFGJ7ZXQZ",
  resolverId: "GDXMWQDVZ5DORJFPIPUDFRML2OEPBMSG77J2TIIGWRIBSRWPT5EK2GG5",
};

export const contracts: Record<ChainId, ContractConfig> = {
  "solana-local": solanaLocalContracts,
  "solana-devnet": solanaDevnetContracts,
  "stellar-local": stellarLocalContracts,
  "stellar-testnet": stellarTestnetContracts,
};

export function getContractConfig(chainId: ChainId): ContractConfig {
  return contracts[chainId];
}
