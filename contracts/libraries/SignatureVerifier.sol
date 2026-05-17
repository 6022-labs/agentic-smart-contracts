// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Signature verifier for ERC-3668 signed gateway responses
/// @dev Mirrors the ENS offchain-resolver `SignatureVerifier`. The gateway signs
///      keccak256(0x1900 || target || expires || keccak256(request) || keccak256(result)).
///      The leading `0x1900` matches the EIP-191 "version 0x00" prefix used by
///      the ENS reference implementation — keep it byte-for-byte in sync with
///      the off-chain gateway's signing code.
library SignatureVerifier {
    /// @dev The signed response has already expired.
    error SignatureExpired(uint64 expires);

    function makeSignatureHash(
        address target,
        uint64 expires,
        bytes memory request,
        bytes memory result
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    hex"1900",
                    target,
                    expires,
                    keccak256(request),
                    keccak256(result)
                )
            );
    }

    /// @dev Decodes `response` as (result, expires, sig), checks it has not
    ///      expired, and recovers the address that signed it.
    /// @param target The resolver address the gateway signed against.
    /// @param request The original lookup callData (= extraData).
    /// @param response The gateway response: abi.encode(bytes result, uint64 expires, bytes sig).
    function verify(
        address target,
        bytes calldata request,
        bytes calldata response
    ) internal view returns (address signer, bytes memory result) {
        uint64 expires;
        bytes memory sig;
        (result, expires, sig) = abi.decode(response, (bytes, uint64, bytes));

        if (expires < block.timestamp) {
            revert SignatureExpired(expires);
        }

        bytes32 hash = makeSignatureHash(target, expires, request, result);
        signer = ECDSA.recover(hash, sig);
    }
}
