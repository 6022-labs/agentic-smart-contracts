// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

import {IExtendedResolver} from "@ensdomains/ens-contracts/contracts/resolvers/profiles/IExtendedResolver.sol";
import {IAgentEnsOffchainResolverStates} from "./IAgentEnsOffchainResolverStates.sol";
import {IAgentEnsOffchainResolverEvents} from "./IAgentEnsOffchainResolverEvents.sol";
import {IAgentEnsOffchainResolverErrors} from "./IAgentEnsOffchainResolverErrors.sol";
import {IAgentEnsOffchainResolverAdminActions} from "./IAgentEnsOffchainResolverAdminActions.sol";

interface IAgentEnsOffchainResolver is
    IAccessControl,
    IExtendedResolver,
    IAgentEnsOffchainResolverStates,
    IAgentEnsOffchainResolverEvents,
    IAgentEnsOffchainResolverErrors,
    IAgentEnsOffchainResolverAdminActions
{
    /// @dev ERC-3668 callback. Verifies the gateway's signed response against a
    ///      trusted signer and returns the resolved record bytes.
    /// @param response The gateway response: abi.encode(bytes result, uint64 expires, bytes sig).
    /// @param extraData The original lookup callData carried through from `resolve`.
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory);
}
