// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsOffchainResolverAdminActions {
    /// @dev Replace the off-chain gateway URL list.
    function setUrls(string[] calldata newUrls) external;

    /// @dev Add or remove a trusted gateway signer.
    function setSigner(address signer, bool trusted) external;
}
