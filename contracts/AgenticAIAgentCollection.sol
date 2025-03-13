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

struct MintRequest {
    address to;
    bytes32 agentAddressesHash;
    bytes32 nonce;
}

contract AgenticAIAgentCollection is ERC721, EIP712, AccessControl, IAgenticAIAgentCollection {
    using ECDSA for bytes32;

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    uint256 public nextTokenId;
    mapping(bytes32 => bool) public usedNonces;

    string private baseURI;
    mapping(uint256 => address) private _tokenToSigner;
    mapping(uint256 => address[]) private _tokenToWallets;

    string private constant SIGNING_DOMAIN = "VerifiedMintNFT";
    string private constant SIGNATURE_VERSION = "1";

    constructor()
        ERC721("AgenticAIAgentCollection", "AIAgent") 
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
    {
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

    function setBaseURI(string memory newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenSigner(uint256 tokenId) external view returns (address) {
        return _tokenToSigner[tokenId];
    }

    function tokenWallets(uint256 tokenId) external view returns (address[] memory) {
        return _tokenToWallets[tokenId];
    }

    function mintWithSignature(
        address to,
        address[] memory agentAddresses,
        address signer,
        bytes32 nonce,
        bytes memory signature
    ) public {
        if (usedNonces[nonce]) {
            revert UsedNonce(nonce);
        }
        if (!_isValidSignature(to, agentAddresses, signer, nonce, signature)) {
            revert InvalidSignature(signature);
        }

        usedNonces[nonce] = true;
        _tokenToSigner[nextTokenId] = signer;
        _tokenToWallets[nextTokenId] = agentAddresses;

        _safeMint(to, nextTokenId);

        emit MintedWithSignature(to, signer, nextTokenId);

        nextTokenId++;
    }

    function updateTokenSigner(uint256 tokenId, address newSigner) onlyRole(SIGNER_ROLE) external {
        if (!hasRole(SIGNER_ROLE, newSigner)) {
            revert AddressIsNotSigner();
        }

        _tokenToSigner[tokenId] = newSigner;
        emit TokenSignerUpdated(tokenId, _msgSender(), newSigner);
    }

    function _isValidSignature(
        address to,
        address[] memory agentAddresses,
        address signer,
        bytes32 nonce,
        bytes memory signature
    ) internal view returns (bool) {
        // Hash the agentAddresses array separately
        bytes32 agentAddressesHash = keccak256(abi.encodePacked(agentAddresses));

        // Hash the entire struct
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("MintRequest(address to,bytes32 agentAddressesHash,address signer,bytes32 nonce)"),
            to,
            agentAddressesHash,
            signer,
            nonce
        )));

        // Recover signer and check role
        address recoveredSigner = ECDSA.recover(digest, signature);
        return hasRole(SIGNER_ROLE, recoveredSigner) && recoveredSigner == signer;
    }
}
