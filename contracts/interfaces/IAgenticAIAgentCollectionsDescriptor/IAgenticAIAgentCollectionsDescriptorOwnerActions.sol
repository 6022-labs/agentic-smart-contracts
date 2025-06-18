// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsDescriptorOwnerActions {
    /// @dev Update the IPFS gateway used to resolve images.
    /// @param ipfsGateway The new IPFS gateway URL.
    function updateIpfsGateway(string memory ipfsGateway) external;
}
