# Sample Hardhat Project

This project uses Hardhat with `hardhat-deploy` for deployments. Per-network
parameters (collateral controller, ENS parent node, gateway URLs and signer)
live in the `networks` section of `hardhat.config.ts`; the `deploy/` scripts
read them and skip on networks where they are absent.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node

# Deploy. Each script skips itself on networks it doesn't apply to, so the
# network selects what gets deployed (core+registry on polygon/amoy, core on
# citreaTestnet, resolver on ethereum/sepolia).
npx hardhat deploy --network <MY_NETWORK>

# Optional: only a subset, or force a fresh deploy
npx hardhat deploy --network <MY_NETWORK> --tags core
npx hardhat deploy --network <MY_NETWORK> --reset

# Verify the deployed contracts
npx hardhat etherscan-verify --network <MY_NETWORK>
```

The Creator deployment automatically grants `CREATOR_ROLE` on the Manager. Other
optional post-deploy setup:

```shell
npx hardhat add-authorized-token-for-creation --collection-creator-address <COLLECTION_CREATOR_ADDRESS> --token-address <TOKEN_ADDRESS> --token-amount <TOKEN_AMOUNT> --network <MY_NETWORK>

npx hardhat add-signer-to-manager --collections-manager-address <COLLECTION_MANAGER_ADDRESS> --signer <SIGNER_ADDRESS> --network <MY_NETWORK>
```

## License

MIT — see [LICENSE](LICENSE).
