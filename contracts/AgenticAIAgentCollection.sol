// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {ENSUtils} from "./libraries/ENSUtils.sol";
import {AgentImagesLib} from "./libraries/AgentImagesLib.sol";
import {AgenticSignatureLib} from "./libraries/AgenticSignatureLib.sol";

import {KeyValue} from "./types/KeyValue.sol";
import {AgentInformation} from "./types/AgentInformation.sol";
import {IAgenticAIAgentCollection} from "./interfaces/IAgenticAIAgentCollection/IAgenticAIAgentCollection.sol";
import {IAgenticAIAgentCollectionsManagerStates} from "./interfaces/IAgenticAIAgentCollectionsManager/IAgenticAIAgentCollectionsManagerStates.sol";
import {IAgenticAIAgentCollectionsDescriptorActions} from "./interfaces/IAgenticAIAgentCollectionsDescriptor/IAgenticAIAgentCollectionsDescriptorActions.sol";

struct MintProposal {
    string name;
    string role;
    address owner;
    address signer;
    string mission;
    address creator;
    address[] wallets;
    KeyValue[] images;
}

struct AddOrUpdateImageProposal {
    uint256 tokenId;
    KeyValue image;
}

/// @title Agentic AI agent NFT collection
/// @dev ERC721 collection that supports off-chain minting proposals and image management.
contract AgenticAIAgentCollection is
    ERC721Upgradeable,
    EIP712Upgradeable,
    AccessControlUpgradeable,
    IAgenticAIAgentCollection
{
    using ECDSA for bytes32;
    using AgentImagesLib for KeyValue[];

    string private constant SIGNING_DOMAIN = "AgenticAIAgentCollection";
    string private constant SIGNATURE_VERSION = "1";

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    mapping(bytes32 => bool) private _isNonceUsed;
    mapping(string => uint256) private _tokenIdOf;
    mapping(uint256 => AgentInformation) private _agentInformationOf;

    MintProposal[] private _mintProposals;
    AddOrUpdateImageProposal[] private _addOrUpdateImageProposals;

    string public description;
    uint256 public moderatorCount;
    uint256 public nextTokenId;

    address public collectionsManager;
    address public collectionsDescriptor;

    constructor() {
        _disableInitializers();
    }

    /// @dev Initialize a new agent collection.
    /// @param name ERC721 name of the collection.
    /// @param symbol ERC721 symbol of the collection.
    /// @param admin Address granted the default admin role.
    /// @param moderator Address granted the moderator role.
    /// @param initialCollectionsManager Address of the collections manager contract.
    /// @param initialCollectionsDescriptor Address of the descriptor contract.
    function initialize(
        string memory name,
        string memory symbol,
        string memory initialDescription,
        address admin,
        address moderator,
        address initialCollectionsManager,
        address initialCollectionsDescriptor
    ) external initializer {
        collectionsManager = initialCollectionsManager;
        collectionsDescriptor = initialCollectionsDescriptor;

        nextTokenId = 1;
        description = initialDescription;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MODERATOR_ROLE, moderator);

        __ERC721_init(name, symbol);
        __EIP712_init(SIGNING_DOMAIN, SIGNATURE_VERSION);
        __AccessControl_init();
    }

    /// @dev See {AccessControl-_grantRole}.
    function _grantRole(bytes32 role, address account) internal override returns (bool) {
        if (role == MODERATOR_ROLE) {
            moderatorCount++;
        }
        return super._grantRole(role, account);
    }

    /// @dev See {AccessControl-_revokeRole}.
    function _revokeRole(bytes32 role, address account) internal override returns (bool) {
        if (role == MODERATOR_ROLE) {
            moderatorCount--;
        }
        return super._revokeRole(role, account);
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

        return IAgenticAIAgentCollectionsDescriptorActions(collectionsDescriptor).
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

    /// @dev Get the signer address of an agent.
    /// @param tokenId The token identifier.
    function signerOf(uint256 tokenId) external view returns (address) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].signer;
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

    /// @dev Get all stored images of an agent.
    /// @param tokenId The token identifier.
    function imagesOf(uint256 tokenId) external view returns (KeyValue[] memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].images;
    }

    /// @dev Get the mission of an agent.
    /// @param tokenId The token identifier.
    function missionOf(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].mission;
    }

    /// @dev Get the list of agent wallets of an agent.
    /// @param tokenId The token identifier.
    function walletsOf(
        uint256 tokenId
    ) external view returns (address[] memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].wallets;
    }

    /// @dev Get the token ID associated to the agent name.
    /// @param name The name of the agent.
    function tokenIdOf(string memory name) external view returns (uint256) {
        return _tokenIdOf[name];
    }

    /// @dev Check whether a nonce has already been used.
    /// @param nonce The nonce to query.
    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return _isNonceUsed[nonce];
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
    function addOrUpdateProposalsLength() external view returns (uint256) {
        return _addOrUpdateImageProposals.length;
    }

    /// @dev Get an image proposal by index.
    /// @param proposalIndex Index of the proposal.
    function addOrUpdateProposal(uint256 proposalIndex) external view returns (AddOrUpdateImageProposal memory) {
        return _addOrUpdateImageProposals[proposalIndex];
    }

    /// @dev Update the signer address of an agent.
    /// @param tokenId The token to update.
    /// @param newSigner The new signer address.
    /// @param nonce Unique nonce used for signature.
    /// @param signature Off-chain signature authorizing the change.
    function updateAgentSigner(
        uint256 tokenId,
        address newSigner,
        bytes32 nonce,
        bytes memory signature
    ) external {
        if (_isNonceUsed[nonce]) {
            revert UsedNonce(nonce);
        }

        if (ownerOf(tokenId) != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }

        if (!IAgenticAIAgentCollectionsManagerStates(collectionsManager).isSigner(newSigner)) {
            revert NotSigner(newSigner);
        }

        address oldSigner = _agentInformationOf[tokenId].signer;
        if (oldSigner == newSigner) {
            revert SignerUnchanged(oldSigner);
        }

        address recoveredAddress = _recoverUpdateAgentSignerSigner(AgenticSignatureLib.UpdateAgentSignerParams({
            tokenId: tokenId,
            newSigner: newSigner,
            nonce: nonce
        }), signature);

        if (!IAgenticAIAgentCollectionsManagerStates(collectionsManager).isSigner(recoveredAddress)) {
            revert NotSigner(recoveredAddress);
        }

        _agentInformationOf[tokenId].signer = newSigner;
        _isNonceUsed[nonce] = true;

        emit AgentSignerUpdated(tokenId, oldSigner, newSigner);
    }

    /// @dev Update the mission of an agent.
    /// @param tokenId The token whose mission is updated.
    /// @param newMission The new mission text.
    function updateAgentMission(uint256 tokenId, string memory newMission) external {
        _requireMinted(tokenId);

        if (ownerOf(tokenId) != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }

        AgentInformation storage agentInfo = _agentInformationOf[tokenId];
        string memory oldMission = agentInfo.mission;
        agentInfo.mission = newMission;

        emit AgentMissionUpdated(tokenId, oldMission, newMission);
    }

    /// @dev Propose to add or update an image for a token. (used if moderators setup)
    /// @param tokenId The token affected by the proposal.
    /// @param image The key/value pair representing the image.
    function createAddOrUpdateImageProposal(
        uint256 tokenId,
        KeyValue memory image
    ) external {
        _requireModerator();
        _requireMinted(tokenId);
        if (ownerOf(tokenId) != _msgSender() && !hasRole(MODERATOR_ROLE, _msgSender())) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }

        bool isProposalAlreadyExistForThisAgentAndKey = false;

        for (uint256 i = 0; i < _addOrUpdateImageProposals.length; i++) {
            if (
                _addOrUpdateImageProposals[i].tokenId == tokenId &&
                keccak256(abi.encodePacked(_addOrUpdateImageProposals[i].image.key)) == keccak256(abi.encodePacked(image.key))
            ) {
                _addOrUpdateImageProposals[i].image = image;
                isProposalAlreadyExistForThisAgentAndKey = true;
                break;
            }
        }

        if (!isProposalAlreadyExistForThisAgentAndKey) {
            _addOrUpdateImageProposals.push(AddOrUpdateImageProposal({
                tokenId: tokenId,
                image: image
            }));

            emit AgentImageProposalCreated(
                tokenId,
                image.key,
                _addOrUpdateImageProposals.length - 1
            );
        }
    }

    /// @dev Add or update an image for a token. (allowed when no moderators are
    /// setup or the caller is a moderator)
    /// @param tokenId The token affected.
    /// @param image The key/value pair representing the image.
    function addOrUpdateImage(
        uint256 tokenId,
        KeyValue memory image
    ) external {
        _requireNoModeratorOrSenderIsModerator();
        _requireMinted(tokenId);
        if (ownerOf(tokenId) != _msgSender() && !hasRole(MODERATOR_ROLE, _msgSender())) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }

        _addOrUpdateImage(
            tokenId,
            image
        );
    }

    /// @dev Apply an image proposal.
    /// @param proposalIndex The index of the proposal to apply.
    function addOrUpdateImageFromProposal(
        uint256 proposalIndex
    ) external onlyRole(MODERATOR_ROLE) {
        AddOrUpdateImageProposal memory proposalInfo = _addOrUpdateImageProposals[proposalIndex];

        _addOrUpdateImage(
            proposalInfo.tokenId,
            proposalInfo.image
        );

        _popAddOrUpdateImageProposalAt(proposalIndex);
    }

    function _addOrUpdateImage(
        uint256 tokenId,
        KeyValue memory image
    ) internal {
        AgentInformation storage agentInformation = _agentInformationOf[tokenId];

        string memory oldValue = agentInformation.images.addOrUpdateImage(image.key, image.value);

        emit AgentImageUpdated(
            tokenId,
            image.key,
            oldValue,
            image.value
        );
    }

    /// @dev Refuse an image proposal.
    /// @param proposalIndex The index of the proposal to refuse.
    function refuseAddOrUpdateImageProposal(
        uint256 proposalIndex
    ) external onlyRole(MODERATOR_ROLE) {
        _popAddOrUpdateImageProposalAt(proposalIndex);
    }

    /// @dev Remove an image from a token.
    /// @param tokenId The token whose image is removed.
    /// @param key The key of the image to remove.
    function removeImage(
        uint256 tokenId,
        string memory key
    ) external {
        _requireMinted(tokenId);
        if (ownerOf(tokenId) != _msgSender() && !hasRole(MODERATOR_ROLE, _msgSender())) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }

        KeyValue[] storage images = _agentInformationOf[tokenId].images;
        images.removeImage(key);

        if (!images.imagesContainDefault()) {
            revert MissingDefaultImage();
        }
    }

    /// @dev Propose minting of a new agent token. (used if moderators setup)
    /// @param to The future owner of the token.
    /// @param agentAddresses Wallet addresses controlled by the agent.
    /// @param signer The signer address linked to the agent.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param mission The initial mission for the agent.
    /// @param images A set of images describing the agent.
    /// @param nonce Unique nonce used for signature replay protection.
    /// @param signature Off-chain signature authorizing the mint.
    function createMintProposal(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory mission,
        KeyValue[] memory images,
        bytes32 nonce,
        bytes memory signature
    ) external {
        _requireModerator();
        _validateMint(to, agentAddresses, signer, role, name, mission, images, nonce, signature);

        _isNonceUsed[nonce] = true;
        _mintProposals.push(MintProposal({
            name: name,
            role: role,
            owner: to,
            signer: signer,
            images: images,
            mission: mission,
            creator: _msgSender(),
            wallets: agentAddresses
        }));

        emit MintProposalCreated(to, signer, _mintProposals.length - 1);
    }

    /// @dev Mint a new agent token. (allowed when no moderators are setup or
    /// the caller is a moderator)
    /// @param to The future owner of the token.
    /// @param agentAddresses Wallet addresses controlled by the agent.
    /// @param signer The signer address linked to the agent.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param mission The initial mission for the agent.
    /// @param images A set of images describing the agent.
    /// @param nonce Unique nonce used for signature replay protection.
    /// @param signature Off-chain signature authorizing the mint.
    function mint(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory mission,
        KeyValue[] memory images,
        bytes32 nonce,
        bytes memory signature
    ) external {
        _requireNoModeratorOrSenderIsModerator();
        _validateMint(to, agentAddresses, signer, role, name, mission, images, nonce, signature);
        _isNonceUsed[nonce] = true;
        _mintAgent(to, agentAddresses, signer, role, name, mission, images, _msgSender());
    }

    /// @dev Mint an agent from an approved proposal.
    /// @param proposalIndex The index of the mint proposal to execute.
    function mintFromProposal(
        uint256 proposalIndex
    ) external onlyRole(MODERATOR_ROLE) {
        MintProposal memory proposalInfo = _mintProposals[proposalIndex];
        if (_tokenIdOf[proposalInfo.name] != 0) {
            revert UsedName(proposalInfo.name);
        }
        _mintAgent(
            proposalInfo.owner,
            proposalInfo.wallets,
            proposalInfo.signer,
            proposalInfo.role,
            proposalInfo.name,
            proposalInfo.mission,
            proposalInfo.images,
            proposalInfo.creator
        );
        _popMintProposalAt(proposalIndex);
    }

    /// @dev Internal function to validate minting parameters and signature.
    function _validateMint(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory mission,
        KeyValue[] memory images,
        bytes32 nonce,
        bytes memory signature
    ) internal view {
        if (!ENSUtils.isValidENSName(name)) {
            revert InvalidName(name);
        }
        if (_isNonceUsed[nonce]) {
            revert UsedNonce(nonce);
        }
        if (_tokenIdOf[name] != 0) {
            revert UsedName(name);
        }
        if (!images.imagesContainDefault()) {
            revert MissingDefaultImage();
        }

        address recoveredAddress = _recoverMintSigner(AgenticSignatureLib.MintParams({
            to: to,
            agentAddresses: agentAddresses,
            signer: signer,
            role: role,
            name: name,
            images: images,
            mission: mission,
            nonce: nonce
        }), signature);
        if (!IAgenticAIAgentCollectionsManagerStates(collectionsManager).isSigner(recoveredAddress)) {
            revert NotSigner(recoveredAddress);
        }
        if (recoveredAddress != signer) {
            revert InvalidSigner(recoveredAddress, signer);
        }
    }

    /// @dev Internal function to mint an agent NFT and store its information.
    function _mintAgent(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory mission,
        KeyValue[] memory images,
        address creator
    ) internal {
        _agentInformationOf[nextTokenId] = AgentInformation({
            name: name,
            role: role,
            images: images,
            signer: signer,
            mission: mission,
            creator: creator,
            wallets: agentAddresses
        });
        _tokenIdOf[name] = nextTokenId;
        _safeMint(to, nextTokenId);
        emit Minted(to, signer, nextTokenId);
        emit AgentSignerUpdated(nextTokenId, address(0), signer);
        nextTokenId++;
    }

    /// @dev Refuse a mint proposal.
    /// @param proposalIndex The index of the proposal to refuse.
    function refuseMintProposal(
        uint256 proposalIndex
    ) external onlyRole(MODERATOR_ROLE) {
        _popMintProposalAt(proposalIndex);
    }

    /// @dev Recover the signer used for an update agent signer request.
    function _recoverUpdateAgentSignerSigner(
        AgenticSignatureLib.UpdateAgentSignerParams memory params,
        bytes memory signature
    ) internal view returns (address) {
        bytes32 typedDataHash = AgenticSignatureLib.hashUpdateAgentSignerParams(params);
        bytes32 digest = _hashTypedDataV4(typedDataHash);
        return ECDSA.recover(digest, signature);
    }

    /// @dev Recover the signer used for a mint.
    function _recoverMintSigner(
        AgenticSignatureLib.MintParams memory params,
        bytes memory signature
    ) internal view returns (address) {
        bytes32 typedDataHash = AgenticSignatureLib.hashMintParams(params);
        bytes32 digest = _hashTypedDataV4(typedDataHash);
        return ECDSA.recover(digest, signature);
    }

    function _popAddOrUpdateImageProposalAt(uint256 index) private {
        AddOrUpdateImageProposal memory proposal = _addOrUpdateImageProposals[index];
        uint256 lastIndex = _addOrUpdateImageProposals.length - 1;
        if (index != lastIndex) {
            _addOrUpdateImageProposals[index] = _addOrUpdateImageProposals[lastIndex];
        }
        _addOrUpdateImageProposals.pop();

        emit AgentImageProposalRemoved(
            proposal.tokenId,
            proposal.image.key,
            index
        );
    }

    function _popMintProposalAt(uint256 index) private {
        MintProposal memory proposal = _mintProposals[index];
        uint256 lastIndex = _mintProposals.length - 1;
        if (index != lastIndex) {
            _mintProposals[index] = _mintProposals[lastIndex];
        }
        _mintProposals.pop();

        emit MintProposalRemoved(proposal.owner, proposal.signer, index);
    }

    /// @dev Reverts if there is a moderator set and the caller is not one.
    function _requireNoModeratorOrSenderIsModerator() internal view {
        if (moderatorCount > 0 && !hasRole(MODERATOR_ROLE, _msgSender())) {
            revert NotModerator(_msgSender());
        }
    }

    /// @dev Reverts if there is no moderator set.
    function _requireModerator() internal view {
        if (moderatorCount == 0) {
            revert NoModerators();
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

    struct RecoverMintSignerParams {
        address to;
        address[] agentAddresses;
        address signer;
        string role;
        string name;
        KeyValue[] images;
        string mission;
        bytes32 nonce;
        bytes signature;
    }

    struct RecoverUpdateAgentSignerParams {
        uint256 tokenId;
        address newSigner;
        bytes32 nonce;
        bytes signature;
    }
}
