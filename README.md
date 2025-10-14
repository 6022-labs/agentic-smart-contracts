# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/AgentCollectionCreatorV1.ts --network <MY_NETWORK> --parameters ignition/parameters/<MY_NETWORK>/AgentCollectionCreatorV1.json
```

Once the contracts are deployed, you can setup the contracts with the following tasks:

```shell
npx hardhat add-authorized-token-for-creation --collection-creator-address <COLLECTION_CREATOR_ADDRESS> --token-address <TOKEN_ADDRESS> --token-amount <TOKEN_AMOUNT> --network <MY_NETWORK>

npx hardhat add-creator-to-manager --collections-manager-address <COLLECTION_MANAGER_ADDRESS> --creator <COLLECTION_CREATOR_ADDRESS> --network <MY_NETWORK>
```

Then add signers to the collection manager:

```shell
npx hardhat add-signer-to-manager --collections-manager-address <COLLECTION_MANAGER_ADDRESS> --signer <SIGNER_ADDRESS> --network <MY_NETWORK>
```
