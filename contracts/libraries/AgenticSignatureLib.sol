// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import {KeyValue} from "../types/KeyValue.sol";
import {NullableUint256} from "../types/NullableUint256.sol";

library AgenticSignatureLib {
    using ECDSA for bytes32;

    // --- MintParams ---

    struct MintParams {
        address to;
        address signer;
        string role;
        string name;
        address[] wallets;
        KeyValue[] images;
        KeyValue[] attributes;
        NullableUint256 cloneOf;
        bytes32 nonce;
    }

    bytes32 internal constant MINT_TYPEHASH =
        keccak256(
            "MintRequest(address to,address signer,bytes32 roleHash,bytes32 nameHash,bytes32 walletsHash,bytes32 imagesHash,bytes32 attributesHash,bytes32 cloneOfHash,bytes32 nonce)"
        );

    // Hash MintParams struct
    function hashMintParams(MintParams memory params) internal pure returns (bytes32) {
        bytes32 walletsHash = keccak256(
            abi.encodePacked(params.wallets)
        );
        bytes32 nameHash = keccak256(abi.encodePacked(params.name));
        bytes32 roleHash = keccak256(abi.encodePacked(params.role));
        bytes32 cloneOfHash = params.cloneOf.isSet ? keccak256(abi.encodePacked(params.cloneOf.value)) : bytes32(0);

        bytes32[] memory imagesHashes = new bytes32[](params.images.length);
        for (uint i = 0; i < params.images.length; i++) {
            imagesHashes[i] = keccak256(abi.encodePacked(params.images[i].key, params.images[i].value));
        }
        bytes32 imagesHash = keccak256(abi.encodePacked(imagesHashes));

        bytes32[] memory attributesHashes = new bytes32[](params.attributes.length);
        for (uint i = 0; i < params.attributes.length; i++) {
            attributesHashes[i] = keccak256(abi.encodePacked(params.attributes[i].key, params.attributes[i].value));
        }
        bytes32 attributesHash = keccak256(abi.encodePacked(attributesHashes));

        return keccak256(
            abi.encode(
                MINT_TYPEHASH,
                params.to,
                params.signer,
                roleHash,
                nameHash,
                walletsHash,
                imagesHash,
                attributesHash,
                cloneOfHash,
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