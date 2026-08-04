// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAgentCollectionCreatorV1Events} from "./IAgentCollectionCreatorV1Events.sol";
import {IAgentCollectionCreatorV1Errors} from "./IAgentCollectionCreatorV1Errors.sol";
import {IAgentCollectionCreatorV1OwnerActions} from "./IAgentCollectionCreatorV1OwnerActions.sol";
import {IAgentCollectionCreatorV1Actions} from "./IAgentCollectionCreatorV1Actions.sol";
import {IAgentCollectionCreatorV1States} from "./IAgentCollectionCreatorV1States.sol";

interface IAgentCollectionCreatorV1 is
    IAgentCollectionCreatorV1Events,
    IAgentCollectionCreatorV1Errors,
    IAgentCollectionCreatorV1States,
    IAgentCollectionCreatorV1Actions,
    IAgentCollectionCreatorV1OwnerActions {

}
