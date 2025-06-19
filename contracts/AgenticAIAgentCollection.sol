// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

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
    ERC721,
    EIP712,
    AccessControl,
    IAgenticAIAgentCollection
{
    using ECDSA for bytes32;

    string private constant SIGNING_DOMAIN = "AgenticAIAgentCollection";
    string private constant SIGNATURE_VERSION = "1";
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    string private _description;
    uint256 private _nextTokenId = 1;

    mapping(bytes32 => bool) private _isNonceUsed;
    mapping(string => uint256) private _tokenIdOf;
    mapping(uint256 => AgentInformation) private _agentInformationOf;

    MintProposal[] private _mintProposals;
    AddOrUpdateImageProposal[] private _addOrUpdateImageProposals;

    IAgenticAIAgentCollectionsManagerStates private _collectionsManager;
    IAgenticAIAgentCollectionsDescriptorActions private _collectionsDescriptor;

    /// @dev Deploy a new agent collection.
    /// @param name ERC721 name of the collection.
    /// @param symbol ERC721 symbol of the collection.
    /// @param admin Address granted the default admin role.
    /// @param moderator Address granted the moderator role.
    /// @param initialCollectionsManager Address of the collections manager contract.
    /// @param initialCollectionsDescriptor Address of the descriptor contract.
    constructor(
        string memory name,
        string memory symbol,
        string memory initialDescription,
        address admin,
        address moderator,
        address initialCollectionsManager,
        address initialCollectionsDescriptor
    ) ERC721(name, symbol) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        _collectionsManager = IAgenticAIAgentCollectionsManagerStates(
            initialCollectionsManager
        );
        _collectionsDescriptor = IAgenticAIAgentCollectionsDescriptorActions(
            initialCollectionsDescriptor
        );

        _description = initialDescription;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MODERATOR_ROLE, moderator);
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC721, IERC165, AccessControl)
        returns (bool)
    {
        return
            ERC721.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }

    /// @dev Address of the collections manager contract.
    function collectionsManager() external view returns (address) {
        return address(_collectionsManager);
    }

    /// @dev Address of the collections descriptor contract.
    function collectionsDescriptor() external view returns (address) {
        return address(_collectionsDescriptor);
    }

    /// @dev Description of the collection.
    function description() external view returns (string memory) {
        return _description;
    }

    /// @dev Update the descriptor contract used for metadata.
    /// @param newCollectionsDescriptor Address of the new descriptor contract.
    function updateCollectionsDescriptor(
        address newCollectionsDescriptor
    ) external onlyRole(MODERATOR_ROLE) {
        address oldDescriptor = address(_collectionsDescriptor);

        _collectionsDescriptor = IAgenticAIAgentCollectionsDescriptorActions(
            newCollectionsDescriptor
        );

        emit CollectionsDescriptorUpdated(oldDescriptor, newCollectionsDescriptor);
    }

    /// @dev Update the collection description.
    /// @param newDescription The new description of the collection.
    function updateDescription(
        string memory newDescription
    ) external onlyRole(MODERATOR_ROLE) {
        string memory oldDescription = _description;
        _description = newDescription;

        emit DescriptionUpdated(oldDescription, newDescription);
    }

    /// @dev Get the identifier that will be assigned to the next minted token.
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /// @dev Return the token URI as defined by the descriptor contract.
    /// @param tokenId The token identifier.
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, IERC721Metadata) returns (string memory) {
        _requireMinted(tokenId);

        return _collectionsDescriptor.buildTokenURI(address(this), tokenId);
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

    /// @dev Get all pending mint proposals.
    function mintProposals() external view returns (MintProposal[] memory) {
        return _mintProposals;
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

    /// @dev Get all pending image proposals.
    function addOrUpdateProposals() external view returns (AddOrUpdateImageProposal[] memory) {
        return _addOrUpdateImageProposals;
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

        if (!_collectionsManager.isSigner(newSigner)) {
            revert NotSigner(newSigner);
        }

        address oldSigner = _agentInformationOf[tokenId].signer;
        if (oldSigner == newSigner) {
            revert SignerUnchanged(oldSigner);
        }

        address recoveredAddress = _recoverUpdateAgentSignerSigner(RecoverUpdateAgentSignerParams({
            tokenId: tokenId,
            newSigner: newSigner,
            nonce: nonce,
            signature: signature
        }));

        if (!_collectionsManager.isSigner(recoveredAddress)) {
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

    /// @dev Propose to add or update an image for a token.
    /// @param tokenId The token affected by the proposal.
    /// @param image The key/value pair representing the image.
    function createAddOrUpdateImageProposal(
        uint256 tokenId,
        KeyValue memory image
    ) external {
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

            emit AgentImageProposalCreated(tokenId, image.key);
        }
    }

    function _popAddOrUpdateImageProposalAt(uint256 index) private {
        AddOrUpdateImageProposal memory proposal = _addOrUpdateImageProposals[index];
        uint256 lastIndex = _addOrUpdateImageProposals.length - 1;
        if (index != lastIndex) {
            _addOrUpdateImageProposals[index] = _addOrUpdateImageProposals[lastIndex];
        }
        _addOrUpdateImageProposals.pop();

        emit AgentImageProposalRemoved(proposal.tokenId, proposal.image.key);
    }

    function _popMintProposalAt(uint256 index) private {
        MintProposal memory proposal = _mintProposals[index];
        uint256 lastIndex = _mintProposals.length - 1;
        if (index != lastIndex) {
            _mintProposals[index] = _mintProposals[lastIndex];
        }
        _mintProposals.pop();

        emit MintProposalRemoved(proposal.owner, proposal.signer);
    }

    /// @dev Apply an image proposal.
    /// @param proposalIndex The index of the proposal to apply.
    function addOrUpdateImage(
        uint256 proposalIndex
    ) external onlyRole(MODERATOR_ROLE) {
        AddOrUpdateImageProposal memory proposalInfo = _addOrUpdateImageProposals[proposalIndex];

        bool isImageAlreadyExist = false;
        string memory oldValue = "";

        AgentInformation storage agentInformation = _agentInformationOf[proposalInfo.tokenId];

        for (uint256 i = 0; i < agentInformation.images.length; i++) {
            if (
                keccak256(abi.encodePacked(agentInformation.images[i].key)) == keccak256(abi.encodePacked(proposalInfo.image.key))
            ) {
                oldValue = agentInformation.images[i].value;
                agentInformation.images[i].value = proposalInfo.image.value;
                isImageAlreadyExist = true;
                break;
            }
        }

        if (!isImageAlreadyExist) {
            agentInformation.images.push(KeyValue({
                key: proposalInfo.image.key,
                value: proposalInfo.image.value
            }));
        }

        emit AgentImageUpdated(
            proposalInfo.tokenId,
            proposalInfo.image.key,
            oldValue,
            proposalInfo.image.value
        );

        _popAddOrUpdateImageProposalAt(proposalIndex);
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
        for (uint256 i = 0; i < images.length; i++) {
            if (keccak256(abi.encodePacked(images[i].key)) == keccak256(abi.encodePacked(key))) {
                images[i] = images[images.length - 1];
                images.pop();
                break;
            }
        }

        if (!_imagesContainDefault(images)) {
            revert MissingDefaultImage();
        }
    }

    /// @dev Propose minting of a new agent token.
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
        if (!_isValidENSName(name)) {
            revert InvalidName(name);
        }
        if (_isNonceUsed[nonce]) {
            revert UsedNonce(nonce);
        }
        if (_tokenIdOf[name] != 0) {
            revert UsedName(name);
        }
        if (!_imagesContainDefault(images)) {
            revert MissingDefaultImage();
        }

        address recoveredAddress = _recoverCreateMintProposalSigner(RecoverCreateMintProposalSignerParams({
            to: to,
            agentAddresses: agentAddresses,
            signer: signer,
            role: role,
            name: name,
            images: images,
            mission: mission,
            nonce: nonce,
            signature: signature
        }));

        if (!_collectionsManager.isSigner(recoveredAddress)) {
            revert NotSigner(recoveredAddress);
        }
        if (recoveredAddress != signer) {
            revert InvalidSigner(recoveredAddress, signer);
        }

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

        emit MintProposalCreated(to, signer);
    }

    /// @dev Mint an agent from an approved proposal.
    /// @param proposalIndex The index of the mint proposal to execute.
    function mint(
        uint256 proposalIndex
    ) external onlyRole(MODERATOR_ROLE) {
        MintProposal memory proposalInfo = _mintProposals[proposalIndex];

        if (_tokenIdOf[proposalInfo.name] != 0) {
            revert UsedName(proposalInfo.name);
        }

        _agentInformationOf[_nextTokenId] = AgentInformation({
            name: proposalInfo.name,
            role: proposalInfo.role,
            images: proposalInfo.images,
            signer: proposalInfo.signer,
            mission: proposalInfo.mission,
            creator: proposalInfo.creator,
            wallets: proposalInfo.wallets
        });

        _tokenIdOf[proposalInfo.name] = _nextTokenId;

        _safeMint(proposalInfo.owner, _nextTokenId);

        emit Minted(proposalInfo.owner, proposalInfo.signer, _nextTokenId);
        emit AgentSignerUpdated(_nextTokenId, address(0), proposalInfo.signer);

        _popMintProposalAt(proposalIndex);
        _nextTokenId++;
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
        RecoverUpdateAgentSignerParams memory params
    ) internal view returns (address) {
        bytes32 typedDataHash = keccak256(
            abi.encode(
                keccak256(
                    "UpdateAgentSignerRequest(uint256 tokenId,address newSigner,bytes32 nonce)"
                ),
                params.tokenId,
                params.newSigner,
                params.nonce
            )
        );

        // Hash the entire struct
        bytes32 digest = _hashTypedDataV4(typedDataHash);

        // Recover signer and check role
        return ECDSA.recover(digest, params.signature);
    }

    /// @dev Recover the signer used for a create mint proposal request.
    function _recoverCreateMintProposalSigner(
        RecoverCreateMintProposalSignerParams memory params
    ) internal view returns (address) {
        // Hash the agentAddresses array separately
        bytes32 agentAddressesHash = keccak256(
            abi.encodePacked(params.agentAddresses)
        );
        bytes32 nameHash = keccak256(abi.encodePacked(params.name));
        bytes32 roleHash = keccak256(abi.encodePacked(params.role));
        bytes32 missionHash = keccak256(abi.encodePacked(params.mission));

        bytes32[] memory imagesHashes = new bytes32[](params.images.length);
        for (uint i = 0; i < params.images.length; i++) {
            imagesHashes[i] = keccak256(abi.encodePacked(params.images[i].key, params.images[i].value));
        }
        bytes32 imagesHash = keccak256(abi.encodePacked(imagesHashes));

        bytes32 typedDataHash = keccak256(
            abi.encode(
                keccak256(
                    "CreateMintProposalRequest(address to,bytes32 agentAddressesHash,address signer,bytes32 roleHash,bytes32 nameHash,bytes32 imagesHash,bytes32 missionHash,bytes32 nonce)"
                ),
                params.to,
                agentAddressesHash,
                params.signer,
                roleHash,
                nameHash,
                imagesHash,
                missionHash,
                params.nonce
            )
        );

        // Hash the entire struct
        bytes32 digest = _hashTypedDataV4(typedDataHash);

        // Recover signer and check role
        return ECDSA.recover(digest, params.signature);
    }

    /// @dev Check that the list of images contains one with key `default`.
    function _imagesContainDefault(KeyValue[] memory images) internal pure returns (bool) {
        for (uint256 i = 0; i < images.length; i++) {
            if (keccak256(abi.encodePacked(images[i].key)) == keccak256(abi.encodePacked("default"))) {
                return true;
            }
        }
        return false;
    }

    /// @dev Validate that a string is a valid ENS label.
    function _isValidENSName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length == 0) {
            return false;
        }

        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            if (
                !(char >= 0x61 && char <= 0x7A) && // a-z
                !(char >= 0x30 && char <= 0x39) && // 0-9
                !(char == 0x2D) // -
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * @dev Reverts if the `tokenId` doesn't have a current owner
     * (it hasn't been minted or it has been burned).
     */
    function _requireMinted(uint256 tokenId) internal view returns (address) {
        if (tokenId == 0 || tokenId >= _nextTokenId) {
            revert ERC721NonexistentToken(tokenId);
        }
        return _ownerOf(tokenId);
    }

    struct RecoverCreateMintProposalSignerParams {
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
