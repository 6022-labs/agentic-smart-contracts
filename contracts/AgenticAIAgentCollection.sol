// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IAgenticAIAgentCollection} from "./interfaces/IAgenticAIAgentCollection.sol";
import {IAgenticAIAgentCollectionDescriptor} from "./interfaces/IAgenticAIAgentCollectionDescriptor.sol";

contract AgenticAIAgentCollection is ERC721, EIP712, AccessControl, IAgenticAIAgentCollection {
    using ECDSA for bytes32;

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    uint256 public nextTokenId;
    mapping(bytes32 => bool) public usedNonces;

    mapping(uint256 => address) private _signerOf;
    mapping(uint256 => address) private _creatorOf;
    mapping(uint256 => address[]) private _walletsOf;

    mapping(uint256 => string) private _nameOf;
    mapping(uint256 => string) private _baseImageOf;

    string private constant SIGNING_DOMAIN = "AgenticAIAgentCollection";
    string private constant SIGNATURE_VERSION = "1";

    IAgenticAIAgentCollectionDescriptor private _agentDescriptor;

    constructor(address agentDescriptor)
        ERC721("AgenticAIAgentCollection", "AIAgent") 
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
    {
        _agentDescriptor = IAgenticAIAgentCollectionDescriptor(agentDescriptor);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165, AccessControl) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    function addSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SIGNER_ROLE, signer);
        emit SignerAdded(signer);
    }

    function removeSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(SIGNER_ROLE, signer);
        emit SignerRemoved(signer);
    }

    function updateAgentDescriptor(address agentDescriptor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _agentDescriptor = IAgenticAIAgentCollectionDescriptor(agentDescriptor);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _agentDescriptor.buildTokenURI(this, tokenId);
    }

    function signerOf(uint256 tokenId) external view returns (address) {
        return _signerOf[tokenId];
    }

    function creatorOf(uint256 tokenId) external view returns (address) {
        return _creatorOf[tokenId];
    }

    function walletsOf(uint256 tokenId) external view returns (address[] memory) {
        return _walletsOf[tokenId];
    }

    function nameOf(uint256 tokenId) external view returns (string memory) {
        return _nameOf[tokenId];
    }

    function baseImageOf(uint256 tokenId) external view returns (string memory) {
        return _baseImageOf[tokenId];
    }

    function updateTokenSigner(
        uint256 tokenId,
        address newSigner,
        bytes32 nonce,
        bytes memory signature
    ) external {
        if (usedNonces[nonce]) {
            revert UsedNonce(nonce);
        }

        if (ownerOf(tokenId) != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender(), tokenId);
        }

        if (!hasRole(SIGNER_ROLE, newSigner)) {
            revert NotSigner(newSigner);
        }

        address oldSigner = _signerOf[tokenId];
        if (oldSigner == newSigner) {
            revert SignerUnchanged(oldSigner);
        }

        address recoveredAddress = _recoverUpdateTokenSignerSigner(
            tokenId,
            newSigner,
            nonce,
            signature
        );

        if (!hasRole(SIGNER_ROLE, recoveredAddress)) {
            revert NotSigner(recoveredAddress);
        }

        _signerOf[tokenId] = newSigner;
        usedNonces[nonce] = true;

        emit TokenSignerChanged(tokenId, oldSigner, newSigner);
    }

    function mint(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory name,
        string memory image,
        bytes32 nonce,
        bytes memory signature
    ) external {
        if (usedNonces[nonce]) {
            revert UsedNonce(nonce);
        }

        address recoveredAddress = _recoverMintSigner(
            to,
            agentAddresses,
            signer,
            name,
            image,
            nonce,
            signature
        );

        if (!hasRole(SIGNER_ROLE, recoveredAddress)) {
            revert NotSigner(recoveredAddress);
        }
        if (recoveredAddress != signer) {
            revert InvalidSigner(recoveredAddress, signer);
        }

        usedNonces[nonce] = true;
        _nameOf[nextTokenId] = name;
        _signerOf[nextTokenId] = signer;
        _creatorOf[nextTokenId] = _msgSender();
        _walletsOf[nextTokenId] = agentAddresses;
        _baseImageOf[nextTokenId] = image;

        _safeMint(to, nextTokenId);

        emit Minted(to, signer, nextTokenId);
        emit TokenSignerChanged(nextTokenId, address(0), signer);

        nextTokenId++;
    }

    function _recoverUpdateTokenSignerSigner(
        uint256 tokenId,
        address newSigner,
        bytes32 nonce,
        bytes memory signature
    ) internal view returns (address) {
        bytes32 typedDataHash = keccak256(abi.encode(
            keccak256("UpdateTokenSignerRequest(uint256 tokenId,address newSigner,bytes32 nonce)"),
            tokenId,
            newSigner,
            nonce
        ));

        // Hash the entire struct
        bytes32 digest = _hashTypedDataV4(typedDataHash);

        // Recover signer and check role
        return ECDSA.recover(digest, signature);
    }

    function _recoverMintSigner(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory name,
        string memory image,
        bytes32 nonce,
        bytes memory signature
    ) internal view returns (address) {
        // Hash the agentAddresses array separately
        bytes32 agentAddressesHash = keccak256(abi.encodePacked(agentAddresses));
        bytes32 nameHash = keccak256(abi.encodePacked(name));
        bytes32 imageHash = keccak256(abi.encodePacked(image));

        bytes32 typedDataHash = keccak256(abi.encode(
            keccak256("MintRequest(address to,bytes32 agentAddressesHash,address signer,bytes32 nameHash,bytes32 imageHash,bytes32 nonce)"),
            to,
            agentAddressesHash,
            signer,
            nameHash,
            imageHash,
            nonce
        ));

        // Hash the entire struct
        bytes32 digest = _hashTypedDataV4(typedDataHash);

        // Recover signer and check role
        return ECDSA.recover(digest, signature);
    }
}
