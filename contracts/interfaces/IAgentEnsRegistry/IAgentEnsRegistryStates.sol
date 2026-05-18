// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsRegistryStates {
    /// @dev The collections manager used to gate write access.
    function manager() external view returns (address);

    /// @dev The parent ENS node under which agent subnodes live (namehash of parent domain).
    function parentNode() external view returns (bytes32);

    /// @dev Whether a given agent subnode has been provisioned through this registry.
    function provisioned(bytes32 node) external view returns (bool);

    /// @dev Reverse lookup from an agent subnode to the NFT it stands for.
    ///      Populated when the subnode is first provisioned; returns the zero
    ///      tuple for unprovisioned nodes.
    function agentRef(bytes32 node) external view returns (address collection, uint256 tokenId);

    /// @dev Read a text record. Matches the ENS resolver `text` shape so an
    ///      off-chain gateway / custom L1 resolver can read this registry
    ///      directly. Returns the empty string for unset keys or unprovisioned
    ///      nodes. The `avatar` key is derived on read from the agent's
    ///      `default` image stored on its collection — it is not stored
    ///      directly and cannot be overridden via `setAgentText`.
    function text(bytes32 node, string calldata key) external view returns (string memory);

    /// @dev Read the agent's canonical Ethereum address. Matches the ENS
    ///      resolver `addr` shape. Derived on read from the agent's first
    ///      registered wallet (`walletOfByIndex(tokenId, 0)`); returns
    ///      `address(0)` for unprovisioned nodes or agents with no wallets.
    function addr(bytes32 node) external view returns (address);
}
