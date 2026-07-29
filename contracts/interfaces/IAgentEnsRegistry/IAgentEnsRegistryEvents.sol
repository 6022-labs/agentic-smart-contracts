// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentEnsRegistryEvents {
    /// @dev Emitted when an agent text record is written.
    event AgentTextUpdated(
        address indexed collection,
        uint256 indexed tokenId,
        string key,
        string value
    );

    /// @dev Emitted when an agent subnode is first provisioned and bound to its NFT.
    event SubnodeProvisioned(
        address indexed collection,
        uint256 indexed tokenId,
        bytes32 indexed node,
        string label
    );

    /// @dev Emitted when the collections manager address is updated by admin.
    event ManagerUpdated(address indexed newManager);

    /// @dev Emitted when the parent node is updated by admin.
    event ParentNodeUpdated(bytes32 indexed newParentNode);
}
