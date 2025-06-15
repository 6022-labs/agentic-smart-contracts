// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";

interface IAgenticAIAgentCollectionActions {
    function updateAgentSigner(
        uint256 tokenId,
        address newSigner,
        bytes32 nonce,
        bytes memory signature
    ) external;

    function createAddOrUpdateImageProposal(
        uint256 tokenId,
        KeyValue memory image
    ) external;

    function addOrUpdateImage(
        uint256 proposalIndex
    ) external;

    function removeImage(
        uint256 tokenId,
        string memory key
    ) external;

    function createMintProposal(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory mission,
        KeyValue[] memory images,
        bytes32 nonce,
        bytes memory signature
    ) external;

    function mint(
        uint256 proposalId
    ) external;

    function updateAgentMission(
        uint256 tokenId,
        string memory newMission
    ) external;
}
