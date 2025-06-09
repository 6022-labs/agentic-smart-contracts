// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsManagerOwnerActions {
    /**
     * @dev function to add a new signer.
     * @param signer The address of the signer to add.
     */
    function addSigner(
        address signer
    ) external;

    /**
     * @dev function to remove a signer.
     * @param signer The address of the signer to remove.
     */
    function removeSigner(
        address signer
    ) external;

    /**
     * @dev function to update the address of the collection creator.
     * @param newCollectionCreatorAddress The new address of the collection creator.
     */
    function updateCollectionCreatorAddress(
        address newCollectionCreatorAddress
    ) external;
}
