// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsManagerStates {
    /**
     * @dev function to check if an address is a signer.
     * @param signer The address of the signer to check.
     */
    function isSigner(address signer) external view returns (bool);

    /**
     * @dev function to get the collection address by its ID.
     */
    function collection(uint256 collectionId) external view returns (address);
}
