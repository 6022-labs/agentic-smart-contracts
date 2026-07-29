// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {AgentAddress, EVM_TYPE} from "../types/AgentAddress.sol";

/// @dev Error when an address type is empty or not lowercase alphanumeric.
/// @param addressType The address type that is not valid.
/// @param value The value of the offending entry, to identify it in a list.
error InvalidAddressType(string addressType, string value);

/// @dev Error when an address value is empty.
/// @param addressType The type of the address with the empty value.
error EmptyAddressValue(string addressType);

/// @dev Error when an evm address value is not a parseable non-zero hex address.
/// @param value The value that is not valid.
error InvalidEvmAddressValue(string value);

/// @dev Error when a mint carries no evm-typed address.
error MissingEvmAddress();

library AgentAddressLib {
    /// @dev Validates one entry and canonicalizes evm values to lowercase hex so casing never forks the key.
    function validateAndCanonicalize(
        AgentAddress memory agentAddress
    ) internal pure returns (AgentAddress memory, bool) {
        bytes memory typeBytes = bytes(agentAddress.addressType);
        if (typeBytes.length == 0) {
            revert InvalidAddressType(agentAddress.addressType, agentAddress.value);
        }
        for (uint256 i = 0; i < typeBytes.length; i++) {
            bytes1 char = typeBytes[i];
            if (!((char >= 0x61 && char <= 0x7a) || (char >= 0x30 && char <= 0x39))) {
                revert InvalidAddressType(agentAddress.addressType, agentAddress.value);
            }
        }
        if (bytes(agentAddress.value).length == 0) {
            revert EmptyAddressValue(agentAddress.addressType);
        }
        bool isEvm = Strings.equal(agentAddress.addressType, EVM_TYPE);
        if (isEvm) {
            (bool success, address parsed) = Strings.tryParseAddress(agentAddress.value);
            if (!success || parsed == address(0)) {
                revert InvalidEvmAddressValue(agentAddress.value);
            }
            agentAddress.value = Strings.toHexString(parsed);
        }
        return (agentAddress, isEvm);
    }

    /// @dev Canonicalizes a mint address list and enforces at least one evm entry.
    function canonicalizeAndRequireEvm(
        AgentAddress[] memory addresses
    ) internal pure returns (AgentAddress[] memory) {
        bool hasEvm = false;
        for (uint256 i = 0; i < addresses.length; i++) {
            (AgentAddress memory canonical, bool isEvm) = validateAndCanonicalize(addresses[i]);
            addresses[i] = canonical;
            hasEvm = hasEvm || isEvm;
        }
        if (!hasEvm) {
            revert MissingEvmAddress();
        }
        return addresses;
    }
}
