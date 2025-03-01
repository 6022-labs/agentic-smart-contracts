describe("WhenMintingWithSignature", function () {
  describe("Given a signature from signer", function () {
    describe("Given a valid signature used twice", function () {
      it("Should revert with 'UsedNonce' error on second attempt", async function () {});
    });

    describe("Given a signature that does not match parameters", function () {
      it("Should revert with 'InvalidSignature' error", async function () {});
    });

    describe("Given a signature that match parameters", function () {
      it("Should mint the token", async function () {});

      it("Should assign the NFT to the correct recipient", async function () {});

      it("Should mint the NFT with the expected token ID", async function () {});

      it("Should increment next token id", async function () {});

      it("Should mark the nonce as used", async function () {});
    });
  });

  describe("Given a signature from a non-signer", function () {
    it("Should revert with 'InvalidSignature' error", async function () {});
  });
});
