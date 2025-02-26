const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

describe("travel-token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TravelToken;

  it("Initializes", async () => {
    await program.methods.initialize().rpc();
    console.log("Initialized");
  });

  it("Creates a token", async () => {
    const mint = anchor.web3.Keypair.generate();
    const tokenAccount = anchor.web3.Keypair.generate();
    await program.methods
      .createToken(new anchor.BN(1000))
      .accounts({
        mint: mint.publicKey,
        tokenAccount: tokenAccount.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([mint, tokenAccount])
      .rpc();
    console.log("Token created");
  });
});