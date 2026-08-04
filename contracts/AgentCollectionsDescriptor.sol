// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {UriUtils} from "./libraries/UriUtils.sol";
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

        string memory description = _escapeJSON(collectionStates.description());

        string memory agentName = _escapeJSON(collectionStates.nameOf(tokenId));

        string memory defaultImage = _getDefaultImage(collectionStates, tokenId);
        string memory defaultImageUrl = _escapeJSON(_generateImageUrl(defaultImage));

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

    /// @dev Escape a string for safe inclusion inside a JSON string literal:
    ///      backslash-escape `"` and `\`, use short escapes for `\b \t \n \f \r`,
    ///      and `\u00XX` for any other control character < 0x20 (RFC 8259).
    ///      Applied to all dynamic values (name, description, image URL) so an
    ///      attacker- or moderator-controlled value cannot break out of — or
    ///      produce invalid — the metadata JSON.
    function _escapeJSON(
        string memory value
    ) internal pure returns (string memory) {
        bytes memory valueBytes = bytes(value);
        uint256 extraCount = 0;
        for (uint256 i = 0; i < valueBytes.length; i++) {
            uint8 c = uint8(valueBytes[i]);
            if (c == 0x22 || c == 0x5c) {
                extraCount += 1;
            } else if (c == 0x08 || c == 0x09 || c == 0x0a || c == 0x0c || c == 0x0d) {
                extraCount += 1;
            } else if (c < 0x20) {
                extraCount += 5;
            }
        }
        if (extraCount == 0) {
            return value;
        }

        bytes memory hexDigits = "0123456789abcdef";
        bytes memory escapedBytes = new bytes(valueBytes.length + extraCount);
        uint256 index = 0;
        for (uint256 i = 0; i < valueBytes.length; i++) {
            uint8 c = uint8(valueBytes[i]);
            if (c == 0x22 || c == 0x5c) {
                escapedBytes[index++] = "\\";
                escapedBytes[index++] = valueBytes[i];
            } else if (c == 0x08) {
                escapedBytes[index++] = "\\";
                escapedBytes[index++] = "b";
            } else if (c == 0x09) {
                escapedBytes[index++] = "\\";
                escapedBytes[index++] = "t";
            } else if (c == 0x0a) {
                escapedBytes[index++] = "\\";
                escapedBytes[index++] = "n";
            } else if (c == 0x0c) {
                escapedBytes[index++] = "\\";
                escapedBytes[index++] = "f";
            } else if (c == 0x0d) {
                escapedBytes[index++] = "\\";
                escapedBytes[index++] = "r";
            } else if (c < 0x20) {
                escapedBytes[index++] = "\\";
                escapedBytes[index++] = "u";
                escapedBytes[index++] = "0";
                escapedBytes[index++] = "0";
                escapedBytes[index++] = hexDigits[c >> 4];
                escapedBytes[index++] = hexDigits[c & 0x0f];
            } else {
                escapedBytes[index++] = valueBytes[i];
            }
        }
        return string(escapedBytes);
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
    ///      Values that already carry a scheme pass through untouched.
    function _generateImageUrl(
        string memory image
    ) internal view returns (string memory) {
        return UriUtils.prefixUnlessUri(_ipfsGateway, image);
    }
}
