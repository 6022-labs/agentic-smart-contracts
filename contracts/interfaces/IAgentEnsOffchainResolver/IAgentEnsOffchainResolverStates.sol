// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentEnsOffchainResolverStates {
    /// @dev The off-chain gateway URL at the given index, used in the ERC-3668
    ///      `OffchainLookup` revert.
    function urls(uint256 index) external view returns (string memory);

    /// @dev Whether an address is a trusted gateway signer.
    function signers(address signer) external view returns (bool);
}
