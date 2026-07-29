// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionsDescriptorEvents {
    /// @dev Emitted when the IPFS gateway is updated.
    /// @param oldIpfsGateway The previous IPFS gateway URL.
    /// @param newIpfsGateway The new IPFS gateway URL.
    event IpfsGatewayUpdated(string oldIpfsGateway, string newIpfsGateway);
}
