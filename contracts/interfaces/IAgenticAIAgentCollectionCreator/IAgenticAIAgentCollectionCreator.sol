// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgenticAIAgentCollectionCreatorEvents} from "./IAgenticAIAgentCollectionCreatorEvents.sol";
import {IAgenticAIAgentCollectionCreatorOwnerActions} from "./IAgenticAIAgentCollectionCreatorOwnerActions.sol";
import {IAgenticAIAgentCollectionCreatorActions} from "./IAgenticAIAgentCollectionCreatorActions.sol";
import {IAgenticAIAgentCollectionCreatorStates} from "./IAgenticAIAgentCollectionCreatorStates.sol";

interface IAgenticAIAgentCollectionCreator is
    IAgenticAIAgentCollectionCreatorEvents,
    IAgenticAIAgentCollectionCreatorStates,
    IAgenticAIAgentCollectionCreatorActions,
    IAgenticAIAgentCollectionCreatorOwnerActions {

}
