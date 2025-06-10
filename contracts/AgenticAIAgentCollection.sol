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

import {AgentInformation} from "./interfaces/IAgenticAIAgentCollection/AgentInformation.sol";
import {IAgenticAIAgentCollectionsDescriptor} from "./interfaces/IAgenticAIAgentCollectionsDescriptor.sol";
import {IAgenticAIAgentCollection} from "./interfaces/IAgenticAIAgentCollection/IAgenticAIAgentCollection.sol";
import {IAgenticAIAgentCollectionsManagerStates} from "./interfaces/IAgenticAIAgentCollectionsManager/IAgenticAIAgentCollectionsManagerStates.sol";

contract AgenticAIAgentCollection is
    ERC721,
    EIP712,
    AccessControl,
    IAgenticAIAgentCollection
{
    using ECDSA for bytes32;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    uint256 private _nextTokenId = 1;
    uint256 private _nextProposalId = 1;

    mapping(bytes32 => bool) private _isNonceUsed;
    mapping(string => uint256) private _tokenIdOf;

    mapping(uint256 => AgentInformation) private _agentInformationOf;
    mapping(uint256 => AgentInformation) private _proposalInformationOf;

    string private constant SIGNING_DOMAIN = "AgenticAIAgentCollection";
    string private constant SIGNATURE_VERSION = "1";

    IAgenticAIAgentCollectionsManagerStates private _collectionsManager;
    IAgenticAIAgentCollectionsDescriptor private _collectionsDescriptor;

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
        _collectionsDescriptor = IAgenticAIAgentCollectionsDescriptor(
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
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _collectionsDescriptor = IAgenticAIAgentCollectionsDescriptor(
            collectionsDescriptor
        );
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function nextProposalId() external view returns (uint256) {
        return _nextProposalId;
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

    function imageOf(uint256 tokenId) external view returns (string memory) {
        _requireMinted(tokenId);

        return _agentInformationOf[tokenId].image;
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

    function updateTokenSigner(
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

        address recoveredAddress = _recoverUpdateTokenSignerSigner(RecoverUpdateTokenSignerParams({
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

        emit TokenSignerChanged(tokenId, oldSigner, newSigner);
    }

    function mintProposal(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory image,
        string memory mission,
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

        address recoveredAddress = _recoverMintProposalSigner(RecoverMintProposalSignerParams({
            to: to,
            agentAddresses: agentAddresses,
            signer: signer,
            role: role,
            name: name,
            image: image,
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
        _proposalInformationOf[_nextProposalId] = AgentInformation({
            name: name,
            role: role,
            image: image,
            owner: to,
            signer: signer,
            mission: mission,
            creator: _msgSender(),
            wallets: agentAddresses
        });

        emit MintProposal(to, signer, _nextProposalId);

        _nextProposalId++;
    }

    function mint(
        uint256 proposalId
    ) external onlyRole(MODERATOR_ROLE) {
        AgentInformation memory proposalInfo = _proposalInformationOf[proposalId];

        _agentInformationOf[_nextTokenId] = AgentInformation({
            name: proposalInfo.name,
            role: proposalInfo.role,
            image: proposalInfo.image,
            owner: proposalInfo.owner,
            signer: proposalInfo.signer,
            mission: proposalInfo.mission,
            creator: proposalInfo.creator,
            wallets: proposalInfo.wallets
        });

        _tokenIdOf[proposalInfo.name] = _nextTokenId;

        _safeMint(proposalInfo.owner, _nextTokenId);

        emit Minted(proposalInfo.owner, proposalInfo.signer, _nextTokenId);
        emit TokenSignerChanged(_nextTokenId, address(0), proposalInfo.signer);

        delete _proposalInformationOf[proposalId];
        _nextTokenId++;
    }

    function _recoverUpdateTokenSignerSigner(
        RecoverUpdateTokenSignerParams memory params
    ) internal view returns (address) {
        bytes32 typedDataHash = keccak256(
            abi.encode(
                keccak256(
                    "UpdateTokenSignerRequest(uint256 tokenId,address newSigner,bytes32 nonce)"
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

    function _recoverMintProposalSigner(
        RecoverMintProposalSignerParams memory params
    ) internal view returns (address) {
        // Hash the agentAddresses array separately
        bytes32 agentAddressesHash = keccak256(
            abi.encodePacked(params.agentAddresses)
        );
        bytes32 nameHash = keccak256(abi.encodePacked(params.name));
        bytes32 imageHash = keccak256(abi.encodePacked(params.image));
        bytes32 roleHash = keccak256(abi.encodePacked(params.role));
        bytes32 missionHash = keccak256(abi.encodePacked(params.mission));

        bytes32 typedDataHash = keccak256(
            abi.encode(
                keccak256(
                    "MintProposalRequest(address to,bytes32 agentAddressesHash,address signer,bytes32 roleHash,bytes32 nameHash,bytes32 imageHash,bytes32 missionHash,bytes32 nonce)"
                ),
                params.to,
                agentAddressesHash,
                params.signer,
                roleHash,
                nameHash,
                imageHash,
                missionHash,
                params.nonce
            )
        );

        // Hash the entire struct
        bytes32 digest = _hashTypedDataV4(typedDataHash);

        // Recover signer and check role
        return ECDSA.recover(digest, params.signature);
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

    struct RecoverMintProposalSignerParams {
        address to;
        address[] agentAddresses;
        address signer;
        string role;
        string name;
        string image;
        string mission;
        bytes32 nonce;
        bytes signature;
    }

    struct RecoverUpdateTokenSignerParams {
        uint256 tokenId;
        address newSigner;
        bytes32 nonce;
        bytes signature;
    }
}
