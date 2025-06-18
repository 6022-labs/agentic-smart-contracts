// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {KeyValue} from "./types/KeyValue.sol";
import {IAgenticAIAgentCollectionStates} from "./interfaces/IAgenticAIAgentCollection/IAgenticAIAgentCollectionStates.sol";
import {IAgenticAIAgentCollectionsDescriptor} from "./interfaces/IAgenticAIAgentCollectionsDescriptor/IAgenticAIAgentCollectionsDescriptor.sol";

/// @title Descriptor for Agentic AI collections
/// @dev Provides token metadata generation and stores IPFS gateway information.
contract AgenticAIAgentCollectionsDescriptor is
    AccessControl,
    IAgenticAIAgentCollectionsDescriptor
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
        string memory name = IAgenticAIAgentCollectionStates(collection).nameOf(tokenId);
        KeyValue[] memory images = IAgenticAIAgentCollectionStates(collection).imagesOf(tokenId);

        string memory description = _generateDescription();

        string memory defaultImage = _getDefaultImage(images);
        string memory defaultImageUrl = _generateImageUrl(defaultImage);

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name,
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

    /// @dev Generates a static description for all tokens.
    function _generateDescription() internal pure returns (string memory) {
        return "6022 AI Agent";
    }

    /// @dev Retrieve the default image from the image list.
    ///      Reverts if no image with key `default` is found.
    function _getDefaultImage(KeyValue[] memory images) internal pure returns (string memory) {
        string memory defaultImage = "";

        for (uint256 i = 0; i < images.length; i++) {
            if (
                keccak256(abi.encodePacked(images[i].key)) == keccak256(abi.encodePacked("default"))
            ) {
                defaultImage = images[i].value;
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
