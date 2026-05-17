// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsRegistryAdminActions {
    /// @dev Update the collections manager used to gate write access.
    function setManager(address newManager) external;

    /// @dev Update the parent ENS node under which agent subnodes live.
    function setParentNode(bytes32 newParentNode) external;
}
