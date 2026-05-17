// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsRegistryStates {
    /// @dev The collections manager used to gate write access.
    function manager() external view returns (address);

    /// @dev The parent ENS node under which agent subnodes live (namehash of parent domain).
    function parentNode() external view returns (bytes32);

    /// @dev Whether a given agent subnode has been provisioned through this registry.
    function provisioned(bytes32 node) external view returns (bool);

    /// @dev Read a stored text record. Matches the ENS resolver `text` shape so
    ///      an off-chain gateway / custom L1 resolver can read this registry
    ///      directly. Returns the empty string for unset keys or unprovisioned nodes.
    function text(bytes32 node, string calldata key) external view returns (string memory);
}
