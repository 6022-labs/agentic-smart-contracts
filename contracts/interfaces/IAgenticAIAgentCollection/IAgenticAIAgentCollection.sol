// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {IAgenticAIAgentCollectionStates} from "./IAgenticAIAgentCollectionStates.sol";
import {IAgenticAIAgentCollectionEvents} from "./IAgenticAIAgentCollectionEvents.sol";
import {IAgenticAIAgentCollectionErrors} from "./IAgenticAIAgentCollectionErrors.sol";
import {IAgenticAIAgentCollectionActions} from "./IAgenticAIAgentCollectionActions.sol";
import {IAgenticAIAgentCollectionInitialize} from "./IAgenticAIAgentCollectionInitialize.sol";
import {IAgenticAIAgentCollectionModeratorActions} from "./IAgenticAIAgentCollectionModeratorActions.sol";

interface IAgenticAIAgentCollection is
    IERC721Metadata,
    IAgenticAIAgentCollectionStates,
    IAgenticAIAgentCollectionEvents,
    IAgenticAIAgentCollectionErrors,
    IAgenticAIAgentCollectionActions,
    IAgenticAIAgentCollectionInitialize,
    IAgenticAIAgentCollectionModeratorActions
{

}
