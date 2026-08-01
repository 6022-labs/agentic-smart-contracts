// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Test ERC721 used to exercise the AgentEnsRegistry spoof guard.
/// @dev Spoofs a registered collection's `name()` and claims the caller owns any
///      token. Rejected because its address is not registered with the manager.
contract TestERC721 {
    string private _spoofedName;
    string private _spoofedAgentName;
    address private _attacker;

    constructor(
        string memory spoofedName,
        string memory spoofedAgentName,
        address attacker
    ) {
        _spoofedName = spoofedName;
        _spoofedAgentName = spoofedAgentName;
        _attacker = attacker;
    }

    // --- IERC721Metadata / IERC721 surface used by the registry ---
    function name() external view returns (string memory) {
        return _spoofedName;
    }

    function symbol() external pure returns (string memory) {
        return "EVIL";
    }

    function ownerOf(uint256) external view returns (address) {
        return _attacker;
    }

    // --- IAgentCollectionStates surface used by the registry ---
    function nameOf(uint256) external view returns (string memory) {
        return _spoofedAgentName;
    }

    function addressToTokenId(string memory, string memory) external pure returns (uint256) {
        return 0;
    }
}
