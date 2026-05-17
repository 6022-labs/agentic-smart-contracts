// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IAgentCollectionStates} from "./interfaces/IAgentCollection/IAgentCollectionStates.sol";
import {IAgentCollectionsManagerStates} from "./interfaces/IAgentCollectionsManager/IAgentCollectionsManagerStates.sol";
import {IAgentEnsRegistry} from "./interfaces/IAgentEnsRegistry/IAgentEnsRegistry.sol";
import {ENSUtils} from "./libraries/ENSUtils.sol";
import {KeyValue} from "./types/KeyValue.sol";

/// @title Agent ENS registry
/// @dev Lets an agent's controllers — the NFT owner or any of the agent's
///      registered wallets — write text records under a parent ENS domain
///      (e.g. 6022.eth). An agent must first be initialized with
///      `initAgentTexts`, which provisions the subnode and seeds its records;
///      the batch must include `agent.runtime-url` + `agent.runtime-kind`.
///      `setAgentText` then handles single-record updates. Records are stored
///      in-contract on this (Polygon-side) chain; this registry is the source
///      of truth, read directly by an off-chain gateway / custom L1 resolver.
contract AgentEnsRegistry is AccessControl, IAgentEnsRegistry {
    string private constant RUNTIME_URL_KEY = "agent.runtime-url";
    string private constant RUNTIME_KIND_KEY = "agent.runtime-kind";

    address public manager;
    bytes32 public parentNode;

    mapping(bytes32 => bool) public provisioned;
    mapping(bytes32 => mapping(string => string)) private _texts;

    /// @dev Deploy with manager + parent node. Deployer becomes DEFAULT_ADMIN.
    constructor(address managerAddress, bytes32 parentNode_) {
        manager = managerAddress;
        parentNode = parentNode_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev Gates a call to an agent's controllers: the collection must be
    ///      registered with the manager, and `msg.sender` must either own the
    ///      agent NFT or be one of the agent's registered wallets.
    modifier onlyAgentController(address collection, uint256 tokenId) {
        string memory collectionName = IERC721Metadata(collection).name();
        if (IAgentCollectionsManagerStates(manager).collectionIdByName(collectionName) == 0) {
            revert UnknownCollection(collection);
        }

        if (!_isAgentController(collection, tokenId, msg.sender)) {
            revert NotAgentOwnerOrWallet(collection, tokenId, msg.sender);
        }
        _;
    }

    function initAgentTexts(
        address collection,
        uint256 tokenId,
        KeyValue[] calldata records
    ) external onlyAgentController(collection, tokenId) {
        (bytes32 node, string memory label) = _resolveAgentNode(collection, tokenId);

        if (provisioned[node]) {
            revert AlreadyProvisioned(collection, tokenId);
        }

        _requireMandatoryKeys(records);

        provisioned[node] = true;
        emit SubnodeProvisioned(collection, tokenId, node, label);

        for (uint256 i = 0; i < records.length; i++) {
            _texts[node][records[i].key] = records[i].value;
            emit AgentTextUpdated(collection, tokenId, records[i].key, records[i].value);
        }
    }

    function setAgentText(
        address collection,
        uint256 tokenId,
        string calldata key,
        string calldata value
    ) external onlyAgentController(collection, tokenId) {
        (bytes32 node, ) = _resolveAgentNode(collection, tokenId);

        if (!provisioned[node]) {
            revert NotProvisioned(collection, tokenId);
        }

        _texts[node][key] = value;
        emit AgentTextUpdated(collection, tokenId, key, value);
    }

    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return _texts[node][key];
    }

    function setManager(address newManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        manager = newManager;
        emit ManagerUpdated(newManager);
    }

    function setParentNode(bytes32 newParentNode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        parentNode = newParentNode;
        emit ParentNodeUpdated(newParentNode);
    }

    /// @dev Resolves the agent's ENS node, reverting `InvalidLabel` if the
    ///      agent label is not a valid ENS name. Walks the namehash three
    ///      labels down: parentNode → chainId → collectionName → agentName,
    ///      i.e. the final ENS name is `<agentName>.<collectionName>.<chainId>.<parentDomain>`.
    function _resolveAgentNode(address collection, uint256 tokenId)
        internal
        view
        returns (bytes32 node, string memory label)
    {
        label = IAgentCollectionStates(collection).nameOf(tokenId);
        if (!ENSUtils.isValidENSName(label)) {
            revert InvalidLabel(label);
        }

        string memory collectionName = IERC721Metadata(collection).name();

        bytes32 chainNode = keccak256(
            abi.encodePacked(parentNode, keccak256(bytes(Strings.toString(block.chainid))))
        );
        bytes32 collectionNode = keccak256(
            abi.encodePacked(chainNode, keccak256(bytes(collectionName)))
        );
        node = keccak256(abi.encodePacked(collectionNode, keccak256(bytes(label))));
    }

    /// @dev Reverts unless `records` carries both runtime keys with non-empty values.
    function _requireMandatoryKeys(KeyValue[] calldata records) internal pure {
        bytes32 runtimeUrlHash = keccak256(bytes(RUNTIME_URL_KEY));
        bytes32 runtimeKindHash = keccak256(bytes(RUNTIME_KIND_KEY));

        bool hasRuntimeUrl;
        bool hasRuntimeKind;

        for (uint256 i = 0; i < records.length; i++) {
            if (bytes(records[i].value).length == 0) {
                continue;
            }
            bytes32 keyHash = keccak256(bytes(records[i].key));
            if (keyHash == runtimeUrlHash) {
                hasRuntimeUrl = true;
            } else if (keyHash == runtimeKindHash) {
                hasRuntimeKind = true;
            }
        }

        if (!hasRuntimeUrl) {
            revert MissingRequiredKey(RUNTIME_URL_KEY);
        }
        if (!hasRuntimeKind) {
            revert MissingRequiredKey(RUNTIME_KIND_KEY);
        }
    }

    /// @dev True if `account` controls the agent — it either owns the NFT or is
    ///      one of the agent's registered wallets.
    function _isAgentController(
        address collection,
        uint256 tokenId,
        address account
    ) internal view returns (bool) {
        if (IERC721(collection).ownerOf(tokenId) == account) {
            return true;
        }

        IAgentCollectionStates agentCollection = IAgentCollectionStates(collection);
        uint256 walletCount = agentCollection.walletsCountOf(tokenId);
        for (uint256 i = 0; i < walletCount; i++) {
            if (agentCollection.walletOfByIndex(tokenId, i) == account) {
                return true;
            }
        }

        return false;
    }
}
