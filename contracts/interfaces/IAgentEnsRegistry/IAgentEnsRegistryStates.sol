// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsRegistryStates {
    /// @dev The collections manager used to gate write access.
    function manager() external view returns (address);

    /// @dev The parent ENS node under which agent subnodes live (namehash of parent domain).
    function parentNode() external view returns (bytes32);

    /// @dev Whether a given agent subnode has been provisioned through this registry.
    function provisioned(bytes32 node) external view returns (bool);

    /// @dev Reverse lookup from an agent subnode to its NFT; zero tuple for
    ///      unprovisioned nodes.
    function agentRef(bytes32 node) external view returns (address collection, uint256 tokenId);

    /// @dev ENS `text` shape, so a gateway can read this registry directly.
    ///      Empty string for unset keys. `avatar` is derived on read from the
    ///      collection's `default` image and cannot be set via `setAgentText`.
    function text(bytes32 node, string calldata key) external view returns (string memory);

    /// @dev ENS `addr` shape. Derived on read from the agent's first registered
    ///      wallet; `address(0)` for unprovisioned nodes or agents with no wallet.
    function addr(bytes32 node) external view returns (address);
}
