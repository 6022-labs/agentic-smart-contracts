// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {IAgentCollectionStates} from "./IAgentCollectionStates.sol";
import {IAgentCollectionEvents} from "./IAgentCollectionEvents.sol";
import {IAgentCollectionErrors} from "./IAgentCollectionErrors.sol";
import {IAgentCollectionActions} from "./IAgentCollectionActions.sol";
import {IAgentCollectionInitialize} from "./IAgentCollectionInitialize.sol";
import {IAgentCollectionModeratorActions} from "./IAgentCollectionModeratorActions.sol";

interface IAgentCollection is
    IERC721Metadata,
    IAgentCollectionStates,
    IAgentCollectionEvents,
    IAgentCollectionErrors,
    IAgentCollectionActions,
    IAgentCollectionInitialize,
    IAgentCollectionModeratorActions
{

}
