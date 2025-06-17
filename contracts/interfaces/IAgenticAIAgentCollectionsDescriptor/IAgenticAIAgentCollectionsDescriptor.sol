// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgenticAIAgentCollectionsDescriptorEvents} from "./IAgenticAIAgentCollectionsDescriptorEvents.sol";
import {IAgenticAIAgentCollectionsDescriptorErrors} from "./IAgenticAIAgentCollectionsDescriptorErrors.sol";
import {IAgenticAIAgentCollectionsDescriptorActions} from "./IAgenticAIAgentCollectionsDescriptorActions.sol";
import {IAgenticAIAgentCollectionsDescriptorOwnerActions} from "./IAgenticAIAgentCollectionsDescriptorOwnerActions.sol";

interface IAgenticAIAgentCollectionsDescriptor is
    IAgenticAIAgentCollectionsDescriptorEvents,
    IAgenticAIAgentCollectionsDescriptorErrors,
    IAgenticAIAgentCollectionsDescriptorActions,
    IAgenticAIAgentCollectionsDescriptorOwnerActions
{

}
