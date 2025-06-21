// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import {KeyValue} from "../types/KeyValue.sol";

library AgenticSignatureLib {
    using ECDSA for bytes32;

    // --- MintParams ---

    struct MintParams {
        address to;
        address[] agentAddresses;
        address signer;
        string role;
        string name;
        string mission;
        KeyValue[] images;
        bytes32 nonce;
    }

    bytes32 internal constant MINT_TYPEHASH =
        keccak256(
            "MintRequest(address to,bytes32 agentAddressesHash,address signer,bytes32 roleHash,bytes32 nameHash,bytes32 missionHash,bytes32 imagesHash,bytes32 nonce)"
        );

    // Hash MintParams struct
    function hashMintParams(MintParams memory params) internal pure returns (bytes32) {
        bytes32 agentAddressesHash = keccak256(
            abi.encodePacked(params.agentAddresses)
        );
        bytes32 nameHash = keccak256(abi.encodePacked(params.name));
        bytes32 roleHash = keccak256(abi.encodePacked(params.role));
        bytes32 missionHash = keccak256(abi.encodePacked(params.mission));

        bytes32[] memory imagesHashes = new bytes32[](params.images.length);
        for (uint i = 0; i < params.images.length; i++) {
            imagesHashes[i] = keccak256(abi.encodePacked(params.images[i].key, params.images[i].value));
        }
        bytes32 imagesHash = keccak256(abi.encodePacked(imagesHashes));

        return keccak256(
            abi.encode(
                MINT_TYPEHASH,
                params.to,
                agentAddressesHash,
                params.signer,
                roleHash,
                nameHash,
                missionHash,
                imagesHash,
                params.nonce
            )
        );
    }

    // --- UpdateAgentSignerParams ---

    struct UpdateAgentSignerParams {
        uint256 tokenId;
        address newSigner;
        bytes32 nonce;
    }

    bytes32 internal constant UPDATE_AGENT_SIGNER_TYPEHASH =
        keccak256("UpdateAgentSignerRequest(uint256 tokenId,address newSigner,bytes32 nonce)");

    function hashUpdateAgentSignerParams(UpdateAgentSignerParams memory params) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                UPDATE_AGENT_SIGNER_TYPEHASH,
                params.tokenId,
                params.newSigner,
                params.nonce
            )
        );
    }
}