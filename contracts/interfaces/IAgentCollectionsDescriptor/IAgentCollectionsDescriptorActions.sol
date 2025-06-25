// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionsDescriptorActions {
    /// @dev Build the ERC721 token URI for a specific token.
    /// @param collection The collection address.
    /// @param tokenId The token identifier.
    /// @return The metadata URI.
    function buildTokenURI(address collection, uint256 tokenId) external view returns (string memory);
}
