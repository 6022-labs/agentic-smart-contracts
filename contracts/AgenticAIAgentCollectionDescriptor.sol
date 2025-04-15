// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IAgenticAIAgentCollection } from "./interfaces/IAgenticAIAgentCollection.sol";
import { AgentInformation, IAgenticAIAgentCollectionDescriptor } from "./interfaces/IAgenticAIAgentCollectionDescriptor.sol";

contract AgenticAIAgentCollectionDescriptor is IAgenticAIAgentCollectionDescriptor {
    using Strings for uint256;

    string private _ipfsGateway;

    constructor(string memory ipfsGateway) {
        _ipfsGateway = ipfsGateway;
    }

    function updateIpfsGateway(string memory ipfsGateway) external {
        _ipfsGateway = ipfsGateway;
    }

    function buildTokenURI(
        IAgenticAIAgentCollection collection,
        uint256 tokenId
    ) external view returns (string memory) {
        string memory name = collection.nameOf(tokenId);
        string memory image = collection.imageOf(tokenId);

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

    function agentInformation(
        IAgenticAIAgentCollection collection,
        uint256 tokenId
    ) external view override returns (AgentInformation memory) {
        return
            AgentInformation({
                name: collection.nameOf(tokenId),
                role: collection.roleOf(tokenId),
                image: collection.imageOf(tokenId),
                owner: collection.ownerOf(tokenId),
                signer: collection.signerOf(tokenId),
                creator: collection.creatorOf(tokenId),
                wallets: collection.walletsOf(tokenId)
            });
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
