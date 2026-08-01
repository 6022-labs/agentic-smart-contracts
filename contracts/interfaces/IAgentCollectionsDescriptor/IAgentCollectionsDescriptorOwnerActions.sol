// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionsDescriptorOwnerActions {
    /// @dev Update the IPFS gateway used to resolve images.
    /// @param ipfsGateway The new IPFS gateway URL.
    function updateIpfsGateway(string memory ipfsGateway) external;
}
