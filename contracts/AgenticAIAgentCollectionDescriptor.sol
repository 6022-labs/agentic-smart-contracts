// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import { AgentImageSvg } from "./libraries/AgentImageSvg.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IAgenticAIAgentCollection } from "./interfaces/IAgenticAIAgentCollection.sol";
import { IAgenticAIAgentCollectionDescriptor } from "./interfaces/IAgenticAIAgentCollectionDescriptor.sol";

contract AgenticAIAgentCollectionDescriptor is IAgenticAIAgentCollectionDescriptor {
    using Strings for uint256;

    string private _ipfsGateway;

    constructor(string memory ipfsGateway) {
        _ipfsGateway = ipfsGateway;
    }

    function updateIpfsGateway(string memory ipfsGateway) external {
        _ipfsGateway = ipfsGateway;
    }

    function buildTokenURI(IAgenticAIAgentCollection collection, uint256 tokenId) external view returns (string memory) {
        address signer = collection.signerOf(tokenId);
        address creator = collection.creatorOf(tokenId);
        string memory name = collection.nameOf(tokenId);
        address[] memory wallets = collection.walletsOf(tokenId);
        string memory baseImage = collection.baseImageOf(tokenId); 

        string memory description = _generateDescription(
            _escapeQuotes(name),
            tokenId
        );

        string memory image = Base64.encode(bytes(_generateSVGImage(
            name,
            tokenId,
            signer,
            creator,
            wallets,
            baseImage
        )));

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
                                "data:image/svg+xml;base64,",
                                image,
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

    function _generateDescription(
        string memory name,
        uint256 tokenId
    ) internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "This NFT represent an Agentic AI Agent: ",
                    name,
                    " - ",
                    "Token ID: ",
                    tokenId.toString(),
                    ". ",
                    "The owner of this NFT can change parameters of the associated agent.\\n"
                )
            );
    }

    function _generateSVGImage(
        string memory name,
        uint256 tokenId,
        address signer,
        address creator,
        address[] memory wallets,
        string memory baseImage
    ) internal view returns (string memory svg) {
        bytes32 hash = keccak256(abi.encodePacked(tokenId));
        uint256 numberOfColors = 3 + (uint256(uint8(hash[0])) % 8); // Random number between 3 and 10

        string[] memory borderColors = new string[](numberOfColors);

        for (uint256 i = 0; i < numberOfColors; i++) {
            string memory borderColor = _colorFromHash(hash, uint8(i * 3));
            borderColors[i] = borderColor;
        }

        AgentImageSvg.SVGParams memory svgParams = AgentImageSvg.SVGParams({
            name: name,
            tokenId: tokenId,
            signer: signer,
            creator: creator,
            wallets: wallets,
            borderColors: borderColors,
            baseImage: baseImage,
            ipfsGateway: _ipfsGateway
        });

        return AgentImageSvg.generateSVG(svgParams);
    }

    function _colorFromHash(
        bytes32 hash,
        uint8 offset
    ) private pure returns (string memory) {
        uint8 r = uint8(hash[offset]);
        uint8 g = uint8(hash[offset + 1]);
        uint8 b = uint8(hash[offset + 2]);
        return
            string(
                abi.encodePacked(
                    "#",
                    _toHexString(r),
                    _toHexString(g),
                    _toHexString(b)
                )
            );
    }

    function _toHexString(uint8 value) private pure returns (string memory) {
        bytes memory buffer = new bytes(2);
        buffer[0] = _hexChar(value / 16);
        buffer[1] = _hexChar(value % 16);
        return string(buffer);
    }

    function _hexChar(uint8 value) private pure returns (bytes1) {
        return value < 10 ? bytes1(value + 48) : bytes1(value + 87);
    }
}
