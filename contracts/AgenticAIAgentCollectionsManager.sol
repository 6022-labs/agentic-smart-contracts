// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {IAgenticAIAgentCollectionsManager} from "./interfaces/IAgenticAIAgentCollectionsManager/IAgenticAIAgentCollectionsManager.sol";

contract AgenticAIAgentCollectionsManager is
    AccessControl,
    IAgenticAIAgentCollectionsManager
{
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    address private _collectionCreatorAddress;

    uint256 private _nextCollectionId = 1;

    mapping(uint256 => address) private _collections;
    mapping(string => uint256) private _collectionIdByName;
    mapping(string => uint256) private _collectionIdBySymbol;

    modifier onlyCollectionCreator() {
        if (msg.sender != _collectionCreatorAddress) {
            revert OnlyCollectionCreator();
        }
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SIGNER_ROLE, signer);
        emit SignerAdded(signer);
    }

    function removeSigner(
        address signer
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(SIGNER_ROLE, signer);
        emit SignerRemoved(signer);
    }

    function collectionCreatorAddress() external view returns (address) {
        return _collectionCreatorAddress;
    }

    function updateCollectionCreatorAddress(
        address newCollectionCreatorAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _collectionCreatorAddress = newCollectionCreatorAddress;
    }

    function collection(uint256 collectionId) external view returns (address) {
        return _collections[collectionId];
    }

    function isSigner(address signer) external view override returns (bool) {
        return hasRole(SIGNER_ROLE, signer);
    }

    function addCollection(
        address newCollection
    ) external onlyCollectionCreator {
        string memory name = IERC721Metadata(newCollection).name();
        string memory symbol = IERC721Metadata(newCollection).symbol();

        if (_collectionIdByName[name] != 0) {
            revert CollectionNameAlreadyExists(name);
        }
        if (_collectionIdBySymbol[symbol] != 0) {
            revert CollectionSymbolAlreadyExists(symbol);
        }

        _collections[_nextCollectionId] = address(newCollection);
        _collectionIdByName[name] = _nextCollectionId;
        _collectionIdBySymbol[symbol] = _nextCollectionId;

        emit CollectionCreated(
            _nextCollectionId,
            address(newCollection),
            name,
            symbol
        );

        _nextCollectionId++;
    }
}