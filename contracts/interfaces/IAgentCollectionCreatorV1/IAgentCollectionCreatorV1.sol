// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgentCollectionCreatorV1Events} from "./IAgentCollectionCreatorV1Events.sol";
import {IAgentCollectionCreatorV1OwnerActions} from "./IAgentCollectionCreatorV1OwnerActions.sol";
import {IAgentCollectionCreatorV1Actions} from "./IAgentCollectionCreatorV1Actions.sol";
import {IAgentCollectionCreatorV1States} from "./IAgentCollectionCreatorV1States.sol";
import {IAgentCollectionCreatorV1Errors} from "./IAgentCollectionCreatorV1Errors.sol";

interface IAgentCollectionCreatorV1 is
    IAgentCollectionCreatorV1Events,
    IAgentCollectionCreatorV1States,
    IAgentCollectionCreatorV1Errors,
    IAgentCollectionCreatorV1Actions,
    IAgentCollectionCreatorV1OwnerActions {

}
