// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IExtendedResolver} from "@ensdomains/ens-contracts/contracts/resolvers/profiles/IExtendedResolver.sol";
import {OffchainLookup} from "@ensdomains/ens-contracts/contracts/ccipRead/EIP3668.sol";

import {IAgentEnsOffchainResolver} from "./interfaces/IAgentEnsOffchainResolver/IAgentEnsOffchainResolver.sol";
import {SignatureVerifier} from "./libraries/SignatureVerifier.sol";

/// @title Agent off-chain ENS resolver
/// @dev ERC-3668 / ENSIP-10 resolver. `resolve` always reverts with
///      `OffchainLookup`, pointing CCIP-Read clients at the off-chain gateway.
///      The gateway reads agent records from `AgentEnsRegistry` on the
///      Polygon-side chain and returns a signed response; `resolveWithProof`
///      authenticates that response against a trusted signer set. This contract
///      is meant to live on an ENS-bearing chain (Ethereum L1 / Sepolia).
contract AgentEnsOffchainResolver is AccessControl, IAgentEnsOffchainResolver {
    string[] private _urls;
    mapping(address => bool) public signers;

    /// @dev Deploy with the initial gateway URL list and one trusted signer.
    ///      Deployer becomes DEFAULT_ADMIN.
    constructor(string[] memory urls_, address signer) {
        _urls = urls_;
        signers[signer] = true;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        emit UrlsUpdated(urls_);
        emit SignerUpdated(signer, true);
    }

    function urls(uint256 index) external view returns (string memory) {
        return _urls[index];
    }

    function resolve(bytes calldata name, bytes calldata data)
        external
        view
        returns (bytes memory)
    {
        bytes memory callData = abi.encodeWithSelector(
            IExtendedResolver.resolve.selector,
            name,
            data
        );

        revert OffchainLookup(
            address(this),
            _urls,
            callData,
            this.resolveWithProof.selector,
            callData
        );
    }

    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory)
    {
        (address signer, bytes memory result) = SignatureVerifier.verify(
            address(this),
            extraData,
            response
        );

        if (!signers[signer]) {
            revert UntrustedSigner(signer);
        }

        return result;
    }

    function setUrls(string[] calldata newUrls) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _urls = newUrls;
        emit UrlsUpdated(newUrls);
    }

    function setSigner(address signer, bool trusted) external onlyRole(DEFAULT_ADMIN_ROLE) {
        signers[signer] = trusted;
        emit SignerUpdated(signer, trusted);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IExtendedResolver).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
