// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

import {IAgentEnsRegistryStates} from "./IAgentEnsRegistryStates.sol";
import {IAgentEnsRegistryEvents} from "./IAgentEnsRegistryEvents.sol";
import {IAgentEnsRegistryErrors} from "./IAgentEnsRegistryErrors.sol";
import {IAgentEnsRegistryAgentActions} from "./IAgentEnsRegistryAgentActions.sol";
import {IAgentEnsRegistryAdminActions} from "./IAgentEnsRegistryAdminActions.sol";

interface IAgentEnsRegistry is
    IAccessControl,
    IAgentEnsRegistryStates,
    IAgentEnsRegistryEvents,
    IAgentEnsRegistryErrors,
    IAgentEnsRegistryAgentActions,
    IAgentEnsRegistryAdminActions
{

}
