// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

import {IAgenticAIAgentCollectionsManagerStates} from "./IAgenticAIAgentCollectionsManagerStates.sol";
import {IAgenticAIAgentCollectionsManagerEvents} from "./IAgenticAIAgentCollectionsManagerEvents.sol";
import {IAgenticAIAgentCollectionsManagerErrors} from "./IAgenticAIAgentCollectionsManagerErrors.sol";
import {IAgenticAIAgentCollectionsManagerCollectionCreatorActions} from "./IAgenticAIAgentCollectionsManagerCollectionCreatorActions.sol";

interface IAgenticAIAgentCollectionsManager is
    IAccessControl,
    IAgenticAIAgentCollectionsManagerStates,
    IAgenticAIAgentCollectionsManagerEvents,
    IAgenticAIAgentCollectionsManagerErrors,
    IAgenticAIAgentCollectionsManagerCollectionCreatorActions
{

}
