// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsManagerStates {
    /// @dev Check if an address has the signer role.
    /// @param signer The address to check.
    function isSigner(address signer) external view returns (bool);

    /// @dev Get a collection address by its identifier.
    /// @param collectionId The id of the collection.
    function collection(uint256 collectionId) external view returns (address);
}
