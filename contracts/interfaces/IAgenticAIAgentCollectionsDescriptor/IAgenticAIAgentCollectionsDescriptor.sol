// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgenticAIAgentCollectionsDescriptorErrors} from "./IAgenticAIAgentCollectionsDescriptorErrors.sol";
import {IAgenticAIAgentCollectionsDescriptorActions} from "./IAgenticAIAgentCollectionsDescriptorActions.sol";
import {IAgenticAIAgentCollectionsDescriptorOwnerActions} from "./IAgenticAIAgentCollectionsDescriptorOwnerActions.sol";

interface IAgenticAIAgentCollectionsDescriptor is
    IAgenticAIAgentCollectionsDescriptorErrors,
    IAgenticAIAgentCollectionsDescriptorActions,
    IAgenticAIAgentCollectionsDescriptorOwnerActions
{

}
