// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IAgentCollectionStates} from "./interfaces/IAgentCollection/IAgentCollectionStates.sol";
import {IAgentCollectionsManagerStates} from "./interfaces/IAgentCollectionsManager/IAgentCollectionsManagerStates.sol";
import {IAgentEnsRegistry} from "./interfaces/IAgentEnsRegistry/IAgentEnsRegistry.sol";
import {AgentRef} from "./types/AgentRef.sol";
import {KeyValue} from "./types/KeyValue.sol";

/// @title Agent ENS registry
/// @dev Source of truth for agent text records on this chain, read via the
///      ENS resolver shape (`text(node, key)`, `addr(node)`) by an off-chain
///      gateway / custom L1 resolver. `text(node, "avatar")` and `addr(node)`
///      are derived from the agent's collection on read, so they cannot drift.
contract AgentEnsRegistry is AccessControl, IAgentEnsRegistry {
    string private constant URL_KEY = "url";
    string private constant AVATAR_KEY = "avatar";
    string private constant DEFAULT_IMAGE_KEY = "default";

    bytes32 private constant URL_HASH = keccak256(bytes(URL_KEY));
    bytes32 private constant AVATAR_HASH = keccak256(bytes(AVATAR_KEY));
    bytes32 private constant DEFAULT_IMAGE_HASH = keccak256(bytes(DEFAULT_IMAGE_KEY));

    address public manager;
    bytes32 public parentNode;

    mapping(bytes32 => bool) public provisioned;
    mapping(bytes32 => AgentRef) public agentRef;
    mapping(bytes32 => mapping(string => string)) private _texts;

    constructor(address managerAddress, bytes32 parentNode_) {
        manager = managerAddress;
        parentNode = parentNode_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev `msg.sender` must own the agent NFT or be one of its registered
    ///      wallets, and `collection` must be registered with the manager.
    modifier onlyAgentController(address collection, uint256 tokenId) {
        if (!IAgentCollectionsManagerStates(manager).isKnownCollection(collection)) {
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
        if (provisioned[node]) revert AlreadyProvisioned(collection, tokenId);
        _requireMandatoryKeys(records);

        provisioned[node] = true;
        agentRef[node] = AgentRef(collection, tokenId);
        emit SubnodeProvisioned(collection, tokenId, node, label);

        for (uint256 i = 0; i < records.length; i++) {
            _checkReservedKey(records[i].key);
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
        if (!provisioned[node]) revert NotProvisioned(collection, tokenId);

        _checkReservedKey(key);
        _requireMandatoryKey(key, value);

        _texts[node][key] = value;
        emit AgentTextUpdated(collection, tokenId, key, value);
    }

    function text(bytes32 node, string calldata key) external view returns (string memory) {
        if (keccak256(bytes(key)) == AVATAR_HASH) return _resolveAvatar(node);
        return _texts[node][key];
    }

    function addr(bytes32 node) external view returns (address) {
        AgentRef memory ref = agentRef[node];
        if (ref.collection == address(0)) return address(0);

        IAgentCollectionStates agentCollection = IAgentCollectionStates(ref.collection);
        if (agentCollection.walletsCountOf(ref.tokenId) == 0) return address(0);
        return agentCollection.walletOfByIndex(ref.tokenId, 0);
    }

    function setManager(address newManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        manager = newManager;
        emit ManagerUpdated(newManager);
    }

    function setParentNode(bytes32 newParentNode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        parentNode = newParentNode;
        emit ParentNodeUpdated(newParentNode);
    }

    /// @dev Walks the namehash three labels down: parentNode → chainId →
    ///      collectionName → agentName, mirroring the ENS namehash algorithm.
    function _resolveAgentNode(address collection, uint256 tokenId)
        internal
        view
        returns (bytes32 node, string memory label)
    {
        // Labels validated at mint / initialize and immutable; no re-check here.
        label = IAgentCollectionStates(collection).nameOf(tokenId);
        string memory collectionName = IERC721Metadata(collection).name();

        bytes32 chainNode = keccak256(
            abi.encodePacked(parentNode, keccak256(bytes(Strings.toString(block.chainid))))
        );
        bytes32 collectionNode = keccak256(
            abi.encodePacked(chainNode, keccak256(bytes(collectionName)))
        );

        node = keccak256(abi.encodePacked(collectionNode, keccak256(bytes(label))));
    }

    function _requireMandatoryKeys(KeyValue[] calldata records) internal pure {
        for (uint256 i = 0; i < records.length; i++) {
            if (bytes(records[i].value).length == 0) continue;
            if (keccak256(bytes(records[i].key)) == URL_HASH) return;
        }

        revert MissingRequiredKey(URL_KEY);
    }

    function _requireMandatoryKey(string memory key, string memory value) internal pure {
        if (bytes(value).length > 0) return;
        if (keccak256(bytes(key)) == URL_HASH) revert MissingRequiredKey(URL_KEY);
    }

    function _checkReservedKey(string memory key) internal pure {
        if (keccak256(bytes(key)) == AVATAR_HASH) revert ReservedKey(AVATAR_KEY);
    }

    function _resolveAvatar(bytes32 node) internal view returns (string memory) {
        AgentRef memory ref = agentRef[node];
        if (ref.collection == address(0)) return "";

        IAgentCollectionStates agentCollection = IAgentCollectionStates(ref.collection);
        uint256 imagesCount = agentCollection.imagesCountOf(ref.tokenId);
        for (uint256 i = 0; i < imagesCount; i++) {
            KeyValue memory image = agentCollection.imageOfByIndex(ref.tokenId, i);
            if (keccak256(bytes(image.key)) == DEFAULT_IMAGE_HASH) return image.value;
        }
        return "";
    }

    function _isAgentController(
        address collection,
        uint256 tokenId,
        address account
    ) internal view returns (bool) {
        if (IERC721(collection).ownerOf(tokenId) == account) return true;
        IAgentCollectionStates agentCollection = IAgentCollectionStates(collection);
        uint256 walletCount = agentCollection.walletsCountOf(tokenId);

        for (uint256 i = 0; i < walletCount; i++) {
            if (agentCollection.walletOfByIndex(tokenId, i) == account) return true;
        }

        return false;
    }
}
