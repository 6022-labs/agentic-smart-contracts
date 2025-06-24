// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgentCollectionCreatorEvents} from "./IAgentCollectionCreatorEvents.sol";
import {IAgentCollectionCreatorOwnerActions} from "./IAgentCollectionCreatorOwnerActions.sol";
import {IAgentCollectionCreatorActions} from "./IAgentCollectionCreatorActions.sol";
import {IAgentCollectionCreatorStates} from "./IAgentCollectionCreatorStates.sol";
import {IAgentCollectionCreatorErrors} from "./IAgentCollectionCreatorErrors.sol";

interface IAgentCollectionCreator is
    IAgentCollectionCreatorEvents,
    IAgentCollectionCreatorStates,
    IAgentCollectionCreatorErrors,
    IAgentCollectionCreatorActions,
    IAgentCollectionCreatorOwnerActions {

}
