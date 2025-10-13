// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {KeyValue} from "./types/KeyValue.sol";
import {IAgentCollectionStates} from "./interfaces/IAgentCollection/IAgentCollectionStates.sol";
import {IAgentCollectionsDescriptor} from "./interfaces/IAgentCollectionsDescriptor/IAgentCollectionsDescriptor.sol";

/// @title Descriptor for Agentic AI collections
/// @dev Provides token metadata generation and stores IPFS gateway information.
contract AgentCollectionsDescriptor is
    AccessControl,
    IAgentCollectionsDescriptor
{
    using Strings for uint256;

    string private _ipfsGateway;

    /// @dev Create a new descriptor instance.
    /// @param ipfsGateway Initial IPFS gateway URL used for images.
    constructor(string memory ipfsGateway) {
        _ipfsGateway = ipfsGateway;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev Update the IPFS gateway used to resolve images.
    /// @param ipfsGateway The new IPFS gateway URL.
    function updateIpfsGateway(string memory ipfsGateway) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldGateway = _ipfsGateway;
        _ipfsGateway = ipfsGateway;
        emit IpfsGatewayUpdated(oldGateway, ipfsGateway);
    }

    /// @dev Build the ERC721 token URI for a specific token.
    /// @param collection The collection address.
    /// @param tokenId The token identifier.
    /// @return The metadata URI.
    function buildTokenURI(
        address collection,
        uint256 tokenId
    ) external view returns (string memory) {
        IAgentCollectionStates collectionStates = IAgentCollectionStates(collection);

        string memory description = collectionStates.description();
        description = _escapeQuotes(description);

        string memory agentName = collectionStates.nameOf(tokenId);

        string memory defaultImage = _getDefaultImage(collectionStates, tokenId);
        string memory defaultImageUrl = _generateImageUrl(defaultImage);

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                agentName,
                                '", "description":"',
                                description,
                                '", "image": "',
                                defaultImageUrl,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function _escapeQuotes(
        string memory value
    ) internal pure returns (string memory) {
        bytes memory valueBytes = bytes(value);
        uint256 quotesCount = 0;
        for (uint256 i = 0; i < valueBytes.length; i++) {
            if (valueBytes[i] == '"') {
                quotesCount++;
            }
        }
        if (quotesCount > 0) {
            bytes memory escapedBytes = new bytes(
                valueBytes.length + (quotesCount)
            );
            uint256 index;
            for (uint256 i = 0; i < valueBytes.length; i++) {
                if (valueBytes[i] == '"') {
                    escapedBytes[index++] = "\\";
                }
                escapedBytes[index++] = valueBytes[i];
            }
            return string(escapedBytes);
        }

        return value;
    }

    /// @dev Retrieve the default image from the image list.
    ///      Reverts if no image with key `default` is found.
    function _getDefaultImage(IAgentCollectionStates collectionStates, uint256 tokenId) internal view returns (string memory) {
        string memory defaultImage = "";

        uint256 countOfImages = collectionStates.imagesCountOf(tokenId);

        for (uint256 i = 0; i < countOfImages; i++) {
            KeyValue memory images = collectionStates.imageOfByIndex(tokenId, i);

            if (
                keccak256(abi.encodePacked(images.key)) == keccak256(abi.encodePacked("default"))
            ) {
                defaultImage = images.value;
                break;
            }
        }

        if (keccak256(abi.encodePacked(defaultImage)) == keccak256(abi.encodePacked(""))) {
            revert MissingDefaultImage();
        }

        return defaultImage;
    }

    /// @dev Concatenate the gateway with the image hash to form an URL.
    function _generateImageUrl(
        string memory image
    ) internal view returns (string memory) {
        return string(abi.encodePacked(_ipfsGateway, image));
    }
}
