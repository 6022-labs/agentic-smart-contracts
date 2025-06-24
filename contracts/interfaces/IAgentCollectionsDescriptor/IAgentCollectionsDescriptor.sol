// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgentCollectionsDescriptorEvents} from "./IAgentCollectionsDescriptorEvents.sol";
import {IAgentCollectionsDescriptorErrors} from "./IAgentCollectionsDescriptorErrors.sol";
import {IAgentCollectionsDescriptorActions} from "./IAgentCollectionsDescriptorActions.sol";
import {IAgentCollectionsDescriptorOwnerActions} from "./IAgentCollectionsDescriptorOwnerActions.sol";

interface IAgentCollectionsDescriptor is
    IAgentCollectionsDescriptorEvents,
    IAgentCollectionsDescriptorErrors,
    IAgentCollectionsDescriptorActions,
    IAgentCollectionsDescriptorOwnerActions
{

}
