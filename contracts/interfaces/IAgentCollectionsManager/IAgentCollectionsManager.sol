// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

import {IAgentCollectionsManagerStates} from "./IAgentCollectionsManagerStates.sol";
import {IAgentCollectionsManagerEvents} from "./IAgentCollectionsManagerEvents.sol";
import {IAgentCollectionsManagerErrors} from "./IAgentCollectionsManagerErrors.sol";
import {IAgentCollectionsManagerCollectionCreatorActions} from "./IAgentCollectionsManagerCollectionCreatorActions.sol";

interface IAgentCollectionsManager is
    IAccessControl,
    IAgentCollectionsManagerStates,
    IAgentCollectionsManagerEvents,
    IAgentCollectionsManagerErrors,
    IAgentCollectionsManagerCollectionCreatorActions
{

}
