// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionActions {
    function mintProposal(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory image,
        string memory mission,
        bytes32 nonce,
        bytes memory signature
    ) external;

    function mint(
        uint256 proposalId
    ) external;

    function updateTokenSigner(
        uint256 tokenId,
        address newSigner,
        bytes32 nonce,
        bytes memory signature
    ) external;
}
