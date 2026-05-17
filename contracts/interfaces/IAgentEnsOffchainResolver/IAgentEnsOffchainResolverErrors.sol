// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsOffchainResolverErrors {
    /// @dev The signer recovered from the gateway response is not trusted.
    error UntrustedSigner(address signer);
}
