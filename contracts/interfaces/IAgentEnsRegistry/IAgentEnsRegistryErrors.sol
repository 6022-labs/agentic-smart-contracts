// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsRegistryErrors {
    /// @dev Collection is not registered with the configured manager.
    error UnknownCollection(address collection);

    /// @dev Caller is neither the agent NFT owner nor a registered agent wallet.
    error NotAgentOwnerOrWallet(address collection, uint256 tokenId, address caller);

    /// @dev Agent name resolved from the collection is not a valid ENS label.
    error InvalidLabel(string label);

    /// @dev `initAgentTexts` was called for an agent that is already provisioned.
    error AlreadyProvisioned(address collection, uint256 tokenId);

    /// @dev `setAgentText` was called before the agent was initialized with `initAgentTexts`.
    error NotProvisioned(address collection, uint256 tokenId);

    /// @dev `initAgentTexts` did not include a required key with a non-empty value.
    error MissingRequiredKey(string key);
}
