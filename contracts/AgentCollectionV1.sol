// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {ENSUtils} from "./libraries/ENSUtils.sol";
import {KeyValueLib} from "./libraries/KeyValueLib.sol";

import {KeyValue} from "./types/KeyValue.sol";
import {NullableUint256} from "./types/NullableUint256.sol";
import {AgentInformation} from "./types/AgentInformation.sol";
import {IAgentCollectionV1} from "./interfaces/IAgentCollectionV1/IAgentCollectionV1.sol";
import {IAgentCollectionsDescriptorActions} from "./interfaces/IAgentCollectionsDescriptor/IAgentCollectionsDescriptorActions.sol";

struct MintProposal {
    uint256 id;
    string name;
    string role;
    address owner;
    address creator;
    address[] wallets;
    KeyValue[] images;
    KeyValue[] attributes;
    NullableUint256 cloneOf;
}

struct AddOrUpdateAgentImageProposal {
    uint256 id;
    uint256 tokenId;
    KeyValue image;
}

/// @title Agentic AI agent NFT collection
/// @dev ERC721 collection that supports off-chain minting proposals and image management.
contract AgentCollectionV1 is
    ERC721Upgradeable,
    AccessControlUpgradeable,
    IAgentCollectionV1
{
    using KeyValueLib for KeyValue[];

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    mapping(string => uint256) private _nameToTokenId;
    mapping(address => uint256) private _walletToTokenId;
    mapping(uint256 => AgentInformation) private _agentInformationOf;

    uint256 private _nextProposalId;

    MintProposal[] private _mintProposals;
    mapping(uint256 => uint256) private _mintProposalIndexById;

    AddOrUpdateAgentImageProposal[] private _addOrUpdateAgentImageProposals;
    mapping(uint256 => uint256) private _addOrUpdateAgentImageProposalIndexById;
    mapping(uint256 => mapping(bytes32 => uint256)) private _imageProposalIdByTokenAndKey;

    string public description;
    uint256 public moderatorCount;
    uint256 public nextTokenId;

    address public collectionsDescriptor;

    constructor() {
        _disableInitializers();
    }

    /// @dev Reverts if the caller is neither the agent owner nor one of its wallets.
    modifier onlyAgentController(uint256 tokenId) {
        if (!_isAgentController(tokenId, _msgSender())) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }
        _;
    }

    /// @dev Reverts if the caller is neither an agent controller (owner or
    /// wallet) nor a moderator.
    modifier onlyAgentControllerOrModerator(uint256 tokenId) {
        if (!_isAgentController(tokenId, _msgSender()) && !hasRole(MODERATOR_ROLE, _msgSender())) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }
        _;
    }

    /// @dev Reverts if there is no moderator set.
    modifier onlyWhenModeratorsExist() {
        if (moderatorCount == 0) {
            revert NoModerators();
        }
        _;
    }

    /// @dev Reverts if there is a moderator set and the caller is not one.
    modifier onlyWhenNoModeratorsOrSenderIsModerator() {
        if (moderatorCount > 0 && !hasRole(MODERATOR_ROLE, _msgSender())) {
            revert NotModerator(_msgSender());
        }
        _;
    }

    /// @dev Initialize a new agent collection.
    /// @param name ERC721 name of the collection.
    /// @param symbol ERC721 symbol of the collection.
    /// @param admin Address granted the default admin role.
    /// @param moderator Address granted the moderator role.
    /// @param initialCollectionsDescriptor Address of the descriptor contract.
    function initialize(
        string memory name,
        string memory symbol,
        string memory initialDescription,
        address admin,
        address moderator,
        address initialCollectionsDescriptor
    ) external initializer {
        if (!ENSUtils.isValidENSName(name)) {
            revert InvalidCollectionName(name);
        }
        if (admin == address(0)) {
            revert ZeroAddress("admin");
        }
        if (moderator == address(0)) {
            revert ZeroAddress("moderator");
        }
        if (initialCollectionsDescriptor == address(0)) {
            revert ZeroAddress("initialCollectionsDescriptor");
        }

        collectionsDescriptor = initialCollectionsDescriptor;

        nextTokenId = 1;
        description = initialDescription;

        _nextProposalId = 1;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MODERATOR_ROLE, moderator);

        __ERC721_init(name, symbol);
        __AccessControl_init();
    }

    /// @dev See {AccessControl-_grantRole}. Only adjusts the moderator count on
    /// an actual change so redundant grants don't desync it.
    function _grantRole(bytes32 role, address account) internal override returns (bool) {
        bool granted = super._grantRole(role, account);
        if (granted && role == MODERATOR_ROLE) {
            moderatorCount++;
        }
        return granted;
    }

    /// @dev See {AccessControl-_revokeRole}. Only adjusts the moderator count on
    /// an actual change so spurious revokes don't desync (or underflow) it.
    function _revokeRole(bytes32 role, address account) internal override returns (bool) {
        bool revoked = super._revokeRole(role, account);
        if (revoked && role == MODERATOR_ROLE) {
            moderatorCount--;
        }
        return revoked;
    }

    /// @dev Get the fact that a account is a moderator or not.
    function isModerator(address account) external view returns (bool) {
        return hasRole(MODERATOR_ROLE, account);
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC721Upgradeable, IERC165, AccessControlUpgradeable)
        returns (bool)
    {
        return
            ERC721Upgradeable.supportsInterface(interfaceId) ||
            AccessControlUpgradeable.supportsInterface(interfaceId);
    }

    /// @dev Update the descriptor contract used for metadata.
    /// @param newCollectionsDescriptor Address of the new descriptor contract.
    function updateCollectionsDescriptor(
        address newCollectionsDescriptor
    ) external onlyRole(MODERATOR_ROLE) {
        address oldDescriptor = address(collectionsDescriptor);

        collectionsDescriptor = newCollectionsDescriptor;

        emit CollectionsDescriptorUpdated(oldDescriptor, newCollectionsDescriptor);
    }

    /// @dev Update the collection description.
    /// @param newDescription The new description of the collection.
    function updateDescription(
        string memory newDescription
    ) external onlyRole(MODERATOR_ROLE) {
        string memory oldDescription = description;
        description = newDescription;

        emit DescriptionUpdated(oldDescription, newDescription);
    }

    /// @dev Return the token URI as defined by the descriptor contract.
    /// @param tokenId The token identifier.
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721Upgradeable, IERC721Metadata) returns (string memory) {
        _requireMinted(tokenId);

        return IAgentCollectionsDescriptorActions(collectionsDescriptor).
            buildTokenURI(address(this), tokenId);
    }

    /// @dev Get all stored information for an agent.
    /// @param tokenId The token identifier.
    /// @return The agent information structure.
    function informationOf(
        uint256 tokenId
    ) external view returns (AgentInformation memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId];
    }

    /// @dev Get the creator address of an agent.
    /// @param tokenId The token identifier.
    function creatorOf(uint256 tokenId) external view returns (address) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].creator;
    }

    /// @dev Get the role of an agent
    /// @param tokenId The token identifier.
    function roleOf(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].role;
    }

    /// @dev Get the name of an agent
    /// @param tokenId The token identifier.
    function nameOf(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].name;
    }

    /// @dev Get the number of images of an agent.
    /// @param tokenId The token identifier.
    function imagesCountOf(uint256 tokenId) external view returns (uint256) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].images.length;
    }

    /// @dev Get a specific image of an agent by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the image.
    function imageOfByIndex(uint256 tokenId, uint256 index) external view returns (KeyValue memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].images[index];
    }

    /// @dev Get the number of agent wallets of an agent.
    /// @param tokenId The token identifier.
    function walletsCountOf(uint256 tokenId) external view returns (uint256) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].wallets.length;
    }

    /// @dev Get a specific agent wallet by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the wallet.
    function walletOfByIndex(uint256 tokenId, uint256 index) external view returns (address) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].wallets[index];
    }

    /// @dev Get the number of attributes of an agent.
    /// @param tokenId The token identifier.
    function attributesCountOf(uint256 tokenId) external view returns (uint256) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].attributes.length;
    }

    /// @dev Get a specific attribute of an agent by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the attribute.
    function attributeOfByIndex(uint256 tokenId, uint256 index) external view returns (KeyValue memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].attributes[index];
    }

    /// @dev Get the token ID associated to the agent name.
    /// @param name The name of the agent.
    function nameToTokenId(string memory name) external view returns (uint256) {
        return _nameToTokenId[name];
    }

    /// @dev Get the token ID associated to the agent wallet.
    /// @param wallet The wallet address of the agent.
    function walletToTokenId(address wallet) external view returns (uint256) {
        return _walletToTokenId[wallet];
    }

    /// @dev Number of pending mint proposals.
    function mintProposalsLength() external view returns (uint256) {
        return _mintProposals.length;
    }

    /// @dev Get a mint proposal by index.
    /// @param proposalIndex Index of the proposal.
    function mintProposal(uint256 proposalIndex) external view returns (MintProposal memory) {
        return _mintProposals[proposalIndex];
    }

    /// @dev Number of pending image proposals.
    function addOrUpdateAgentImageProposalsLength() external view returns (uint256) {
        return _addOrUpdateAgentImageProposals.length;
    }

    /// @dev Get an image proposal by index.
    /// @param proposalIndex Index of the proposal.
    function addOrUpdateAgentImageProposal(uint256 proposalIndex) external view returns (AddOrUpdateAgentImageProposal memory) {
        return _addOrUpdateAgentImageProposals[proposalIndex];
    }

    /// @dev Add the attribute key/value pair to a token. If the key already exists, its value is updated.
    /// @param tokenId The token whose attribute key is updated.
    /// @param key The attribute key to update.
    /// @param value The new value for the attribute key.
    function addOrUpdateAgentAttribute(
        uint256 tokenId,
        string memory key,
        string memory value
    ) external onlyAgentController(tokenId) {
        AgentInformation storage agentInfo = _agentInformationOf[tokenId];

        string memory oldValue = agentInfo.attributes.addOrUpdate(key, value);
        emit AgentAttributeUpdated(
            tokenId,
            key,
            oldValue,
            value
        );
    }

    /// @dev Propose to add or update an image for a token. (used if moderators setup)
    /// @param tokenId The token affected by the proposal.
    /// @param image The key/value pair representing the image.
    function createAddOrUpdateAgentImageProposal(
        uint256 tokenId,
        KeyValue memory image
    ) external onlyWhenModeratorsExist onlyAgentControllerOrModerator(tokenId) {
        bytes32 keyHash = keccak256(bytes(image.key));
        uint256 existingProposalId = _imageProposalIdByTokenAndKey[tokenId][keyHash];

        if (existingProposalId != 0) {
            uint256 existingIndex = _addOrUpdateAgentImageProposalIndexById[existingProposalId];
            _addOrUpdateAgentImageProposals[existingIndex].image = image;
            return;
        }

        _addOrUpdateAgentImageProposals.push(AddOrUpdateAgentImageProposal({
            id: _nextProposalId,
            tokenId: tokenId,
            image: image
        }));

        _addOrUpdateAgentImageProposalIndexById[_nextProposalId] = _addOrUpdateAgentImageProposals.length - 1;
        _imageProposalIdByTokenAndKey[tokenId][keyHash] = _nextProposalId;

        emit AgentImageProposalCreated(
            tokenId,
            image.key,
            _nextProposalId
        );

        _nextProposalId++;
    }

    /// @dev Add or update an image for a token. (allowed when no moderators are
    /// setup or the caller is a moderator)
    /// @param tokenId The token affected.
    /// @param image The key/value pair representing the image.
    function addOrUpdateAgentImage(
        uint256 tokenId,
        KeyValue memory image
    ) external onlyWhenNoModeratorsOrSenderIsModerator onlyAgentControllerOrModerator(tokenId) {
        _addOrUpdateAgentImage(
            tokenId,
            image
        );
    }

    /// @dev Apply an image proposal.
    /// @param proposalId The id of the proposal to apply.
    function addOrUpdateAgentImageFromProposal(
        uint256 proposalId
    ) external onlyRole(MODERATOR_ROLE) {
        uint256 proposalIndex = _addOrUpdateAgentImageProposalIndexById[proposalId];
        AddOrUpdateAgentImageProposal memory proposalInfo = _addOrUpdateAgentImageProposals[proposalIndex];

        _addOrUpdateAgentImage(
            proposalInfo.tokenId,
            proposalInfo.image
        );

        _popAddOrUpdateAgentImageProposalAt(proposalId);
    }

    function _addOrUpdateAgentImage(
        uint256 tokenId,
        KeyValue memory image
    ) internal {
        AgentInformation storage agentInformation = _agentInformationOf[tokenId];

        string memory oldValue = agentInformation.images.addOrUpdate(image.key, image.value);

        emit AgentImageUpdated(
            tokenId,
            image.key,
            oldValue,
            image.value
        );
    }

    /// @dev Refuse an image proposal.
    /// @param proposalId The id of the proposal to refuse.
    function refuseAddOrUpdateAgentImageProposal(
        uint256 proposalId
    ) external onlyRole(MODERATOR_ROLE) {
        _popAddOrUpdateAgentImageProposalAt(proposalId);
    }

    /// @dev Remove an image from a token.
    /// @param tokenId The token whose image is removed.
    /// @param key The key of the image to remove.
    function removeAgentImage(
        uint256 tokenId,
        string memory key
    ) external onlyAgentControllerOrModerator(tokenId) {
        KeyValue[] storage images = _agentInformationOf[tokenId].images;
        images.remove(key);

        if (!images.containKey("default")) {
            revert MissingDefaultImage();
        }
    }

    /// @dev Propose minting of a new agent token. (used if moderators setup)
    /// @param to The future owner of the token.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param wallets Wallet addresses controlled by the agent.
    /// @param images A set of images describing the agent.
    /// @param attributes A set of attributes describing the agent.
    /// @param cloneOf The ID of the agent to clone (if any).
    function createMintProposal(
        address to,
        string memory role,
        string memory name,
        address[] memory wallets,
        KeyValue[] memory images,
        KeyValue[] memory attributes,
        NullableUint256 memory cloneOf
    ) external onlyWhenModeratorsExist {
        _validateMintInputs(to, name, wallets, images, cloneOf);

        _mintProposals.push(MintProposal({
            id: _nextProposalId,
            name: name,
            role: role,
            owner: to,
            images: images,
            cloneOf: cloneOf,
            wallets: wallets,
            creator: _msgSender(),
            attributes: attributes
        }));

        _mintProposalIndexById[_nextProposalId] = _mintProposals.length - 1;

        emit MintProposalCreated(to, _nextProposalId);

        _nextProposalId++;
    }

    /// @dev Mint a new agent token. (allowed when no moderators are setup or
    /// the caller is a moderator)
    /// @param to The future owner of the token.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param wallets Wallet addresses controlled by the agent.
    /// @param images A set of images describing the agent.
    /// @param attributes A set of attributes describing the agent.
    /// @param cloneOf The ID of the agent to clone (if any).
    function mint(
        address to,
        string memory role,
        string memory name,
        address[] memory wallets,
        KeyValue[] memory images,
        KeyValue[] memory attributes,
        NullableUint256 memory cloneOf
    ) external onlyWhenNoModeratorsOrSenderIsModerator {
        _validateMintInputs(to, name, wallets, images, cloneOf);
        _mintAgent(to, _msgSender(), role, name, wallets, images, attributes, cloneOf);
    }

    /// @dev Mint an agent from an approved proposal.
    /// @param proposalId The id of the mint proposal to execute.
    function mintFromProposal(
        uint256 proposalId
    ) external onlyRole(MODERATOR_ROLE) {
        uint256 proposalIndex = _mintProposalIndexById[proposalId];
        MintProposal memory proposalInfo = _mintProposals[proposalIndex];

        _requireUniqueNameAndUniqueWallets(proposalInfo.name, proposalInfo.wallets);

        _mintAgent(
            proposalInfo.owner,
            proposalInfo.creator,
            proposalInfo.role,
            proposalInfo.name,
            proposalInfo.wallets,
            proposalInfo.images,
            proposalInfo.attributes,
            proposalInfo.cloneOf
        );
        _popMintProposalAt(proposalId);
    }

    /// @dev Internal function to validate minting parameters.
    function _validateMintInputs(
        address to,
        string memory name,
        address[] memory wallets,
        KeyValue[] memory images,
        NullableUint256 memory cloneOf
    ) internal view {
        if (to == address(0)) {
            revert ZeroAddress("to");
        }
        if (!ENSUtils.isValidENSName(name)) {
            revert InvalidName(name);
        }

        _requireUniqueNameAndUniqueWallets(name, wallets);

        if (!images.containKey("default")) {
            revert MissingDefaultImage();
        }
        if (cloneOf.isSet && (cloneOf.value == 0 || cloneOf.value >= nextTokenId)) {
            revert InvalidCloneOf(cloneOf.value);
        }
    }

    /// @dev Internal function to mint an agent NFT and store its information.
    function _mintAgent(
        address to,
        address creator,
        string memory role,
        string memory name,
        address[] memory wallets,
        KeyValue[] memory images,
        KeyValue[] memory attributes,
        NullableUint256 memory cloneOf
    ) internal {
        uint256 tokenId = nextTokenId;

        _agentInformationOf[tokenId] = AgentInformation({
            name: name,
            role: role,
            images: images,
            wallets: wallets,
            creator: creator,
            cloneOf: cloneOf,
            attributes: attributes
        });
        _nameToTokenId[name] = tokenId;
        for (uint256 i = 0; i < wallets.length; i++) {
            _walletToTokenId[wallets[i]] = tokenId;
        }
        nextTokenId = tokenId + 1;

        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
    }

    /// @dev Refuse a mint proposal.
    /// @param proposalId The id of the proposal to refuse.
    function refuseMintProposal(
        uint256 proposalId
    ) external onlyRole(MODERATOR_ROLE) {
        _popMintProposalAt(proposalId);
    }

    function _popAddOrUpdateAgentImageProposalAt(uint256 proposalId) private {
        uint256 index = _addOrUpdateAgentImageProposalIndexById[proposalId];

        AddOrUpdateAgentImageProposal memory proposal = _addOrUpdateAgentImageProposals[index];
        uint256 lastIndex = _addOrUpdateAgentImageProposals.length - 1;
        if (index != lastIndex) {
            _addOrUpdateAgentImageProposals[index] = _addOrUpdateAgentImageProposals[lastIndex];
            _addOrUpdateAgentImageProposalIndexById[_addOrUpdateAgentImageProposals[index].id] = index;
        }
        _addOrUpdateAgentImageProposals.pop();
        delete _addOrUpdateAgentImageProposalIndexById[proposalId];
        delete _imageProposalIdByTokenAndKey[proposal.tokenId][keccak256(bytes(proposal.image.key))];

        emit AgentImageProposalRemoved(
            proposal.tokenId,
            proposal.image.key,
            proposalId
        );
    }

    function _popMintProposalAt(uint256 proposalId) private {
        uint256 index = _mintProposalIndexById[proposalId];

        MintProposal memory proposal = _mintProposals[index];
        uint256 lastIndex = _mintProposals.length - 1;
        if (index != lastIndex) {
            _mintProposals[index] = _mintProposals[lastIndex];
            _mintProposalIndexById[_mintProposals[index].id] = index;
        }
        _mintProposals.pop();
        delete _mintProposalIndexById[proposalId];

        emit MintProposalRemoved(proposal.owner, proposalId);
    }

    /// @dev Returns true if `account` owns the agent NFT or is one of its registered wallets.
    function _isAgentController(uint256 tokenId, address account) internal view returns (bool) {
        if (ownerOf(tokenId) == account) {
            return true;
        }
        address[] storage wallets = _agentInformationOf[tokenId].wallets;
        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == account) {
                return true;
            }
        }
        return false;
    }

    /// @dev Reverts if name and wallets are already used and wallets are non-zero.
    function _requireUniqueNameAndUniqueWallets(
        string memory name,
        address[] memory wallets
    ) internal view {
        uint256 tokenIdForName = _nameToTokenId[name];
        if (tokenIdForName != 0) {
            revert UsedName(name, tokenIdForName);
        }
        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == address(0)) {
                revert ZeroAddress(string.concat("wallets[", Strings.toString(i), "]"));
            }
            uint256 tokenIdForWallet = _walletToTokenId[wallets[i]];
            if (tokenIdForWallet != 0) {
                revert UsedWallet(wallets[i], tokenIdForWallet);
            }
        }
    }

    /// @dev Reverts if the `tokenId` doesn't have a current owner
    /// (it hasn't been minted or it has been burned).
    function _requireMinted(uint256 tokenId) internal view returns (address) {
        if (tokenId == 0 || tokenId >= nextTokenId) {
            revert ERC721NonexistentToken(tokenId);
        }
        return _ownerOf(tokenId);
    }
}
