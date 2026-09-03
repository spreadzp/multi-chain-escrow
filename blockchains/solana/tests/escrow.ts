import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";

describe("escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program<Escrow>;

  it("connects to local validator", async () => {
    const slot = await provider.connection.getSlot();
    console.log("Connected to local validator at slot:", slot);
    console.log("Program ID:", program.programId.toBase58());
  });
});
