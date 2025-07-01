// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {IAgentCollectionV1States} from "./IAgentCollectionV1States.sol";
import {IAgentCollectionV1Events} from "./IAgentCollectionV1Events.sol";
import {IAgentCollectionV1Errors} from "./IAgentCollectionV1Errors.sol";
import {IAgentCollectionV1Actions} from "./IAgentCollectionV1Actions.sol";
import {IAgentCollectionV1Initialize} from "./IAgentCollectionV1Initialize.sol";
import {IAgentCollectionV1ModeratorActions} from "./IAgentCollectionV1ModeratorActions.sol";

interface IAgentCollectionV1 is
    IERC721Metadata,
    IAgentCollectionV1States,
    IAgentCollectionV1Events,
    IAgentCollectionV1Errors,
    IAgentCollectionV1Actions,
    IAgentCollectionV1Initialize,
    IAgentCollectionV1ModeratorActions
{

}
