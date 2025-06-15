// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

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

contract AgenticAIAgentCollection is
    ERC721,
    EIP712,
    AccessControl,
    IAgenticAIAgentCollection
{
    using ECDSA for bytes32;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint256 private _nextTokenId = 1;

    mapping(bytes32 => bool) private _isNonceUsed;
    mapping(string => uint256) private _tokenIdOf;

    MintProposal[] private _mintProposals;
    AddOrUpdateImageProposal[] private _addOrUpdateImageProposals;

    mapping(uint256 => AgentInformation) private _agentInformationOf;

    string private constant SIGNING_DOMAIN = "AgenticAIAgentCollection";
    string private constant SIGNATURE_VERSION = "1";

    IAgenticAIAgentCollectionsManagerStates private _collectionsManager;
    IAgenticAIAgentCollectionsDescriptorActions private _collectionsDescriptor;

    constructor(
        string memory name,
        string memory symbol,
        address moderator,
        address collectionsManager,
        address collectionsDescriptor
    ) ERC721(name, symbol) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        _collectionsManager = IAgenticAIAgentCollectionsManagerStates(
            collectionsManager
        );
        _collectionsDescriptor = IAgenticAIAgentCollectionsDescriptorActions(
            collectionsDescriptor
        );

        _grantRole(MODERATOR_ROLE, moderator);
    }

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

    function updateCollectionsDescriptor(
        address collectionsDescriptor
    ) external onlyRole(MODERATOR_ROLE) {
        _collectionsDescriptor = IAgenticAIAgentCollectionsDescriptorActions(
            collectionsDescriptor
        );
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, IERC721Metadata) returns (string memory) {
        _requireMinted(tokenId);

        return _collectionsDescriptor.buildTokenURI(address(this), tokenId);
    }

    function signerOf(uint256 tokenId) external view returns (address) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].signer;
    }

    function creatorOf(uint256 tokenId) external view returns (address) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].creator;
    }

    function roleOf(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].role;
    }

    function walletsOf(
        uint256 tokenId
    ) external view returns (address[] memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].wallets;
    }

    function nameOf(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].name;
    }

    function imagesOf(uint256 tokenId) external view returns (KeyValue[] memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].images;
    }

    function missionOf(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].mission;
    }

    function informationOf(
        uint256 tokenId
    ) external view returns (AgentInformation memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId];
    }

    function tokenIdOf(string memory name) external view returns (uint256) {
        return _tokenIdOf[name];
    }

    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return _isNonceUsed[nonce];
    }

    function mintProposalsLength() external view returns (uint256) {
        return _mintProposals.length;
    }

    function mintProposal(uint256 proposalIndex) external view returns (MintProposal memory) {
        return _mintProposals[proposalIndex];
    }

    function mintProposals() external view returns (MintProposal[] memory) {
        return _mintProposals;
    }

    function addOrUpdateProposalsLength() external view returns (uint256) {
        return _addOrUpdateImageProposals.length;
    }

    function addOrUpdateProposal(uint256 proposalIndex) external view returns (AddOrUpdateImageProposal memory) {
        return _addOrUpdateImageProposals[proposalIndex];
    }

    function addOrUpdateProposals() external view returns (AddOrUpdateImageProposal[] memory) {
        return _addOrUpdateImageProposals;
    }

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

    function createdAddOrUpdateImageProposal(
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
        }
    }

    function addOrUpdateImage(
        uint256 proposalIndex
    ) external onlyRole(MODERATOR_ROLE) {
        AddOrUpdateImageProposal memory proposalInfo = _addOrUpdateImageProposals[proposalIndex];

        bool isImageAlreadyExist = false;
        AgentInformation storage agentInformation = _agentInformationOf[proposalInfo.tokenId];

        for (uint256 i = 0; i < agentInformation.images.length; i++) {
            if (
                keccak256(abi.encodePacked(agentInformation.images[i].key)) == keccak256(abi.encodePacked(proposalInfo.image.key))
            ) {
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

        uint256 lastIndex = _addOrUpdateImageProposals.length - 1;
        if (proposalIndex != lastIndex) {
            _addOrUpdateImageProposals[proposalIndex] =
                _addOrUpdateImageProposals[lastIndex];
        }
        _addOrUpdateImageProposals.pop();
    }

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

        delete _mintProposals[proposalIndex];
        _nextTokenId++;
    }

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

    function _imagesContainDefault(KeyValue[] memory images) internal pure returns (bool) {
        for (uint256 i = 0; i < images.length; i++) {
            if (keccak256(abi.encodePacked(images[i].key)) == keccak256(abi.encodePacked("default"))) {
                return true;
            }
        }
        return false;
    }

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
     * @dev Reverts if the `tokenId` doesn't have a current owner (it hasn't been minted, or it has been burned).
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
