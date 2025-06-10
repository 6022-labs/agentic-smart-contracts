// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import { IAgenticAIAgentCollectionStates } from "./interfaces/IAgenticAIAgentCollection/IAgenticAIAgentCollectionStates.sol";
import { IAgenticAIAgentCollectionsDescriptor } from "./interfaces/IAgenticAIAgentCollectionsDescriptor.sol";

contract AgenticAIAgentCollectionsDescriptor is
    IAgenticAIAgentCollectionsDescriptor
{
    using Strings for uint256;

    string private _ipfsGateway;

    constructor(string memory ipfsGateway) {
        _ipfsGateway = ipfsGateway;
    }

    function updateIpfsGateway(string memory ipfsGateway) external {
        _ipfsGateway = ipfsGateway;
    }

    function buildTokenURI(
        address collection,
        uint256 tokenId
    ) external view returns (string memory) {
        string memory name = IAgenticAIAgentCollectionStates(collection).nameOf(tokenId);
        string memory image = IAgenticAIAgentCollectionStates(collection).imageOf(tokenId);

        string memory description = _generateDescription();

        string memory imageUrl = _generateImageUrl(image);

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
                                imageUrl,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function _escapeQuotes(
        string memory name
    ) internal pure returns (string memory) {
        bytes memory nameBytes = bytes(name);
        uint8 quotesCount = 0;
        for (uint8 i = 0; i < nameBytes.length; i++) {
            if (nameBytes[i] == '"') {
                quotesCount++;
            }
        }
        if (quotesCount > 0) {
            bytes memory escapedBytes = new bytes(
                nameBytes.length + (quotesCount)
            );
            uint256 index;
            for (uint8 i = 0; i < nameBytes.length; i++) {
                if (nameBytes[i] == '"') {
                    escapedBytes[index++] = "\\";
                }
                escapedBytes[index++] = nameBytes[i];
            }
            return string(escapedBytes);
        }

        return name;
    }

    function _generateDescription() internal pure returns (string memory) {
        return "6022 AI Agent";
    }

    function _generateImageUrl(
        string memory image
    ) internal view returns (string memory) {
        return string(abi.encodePacked(_ipfsGateway, image));
    }
}
