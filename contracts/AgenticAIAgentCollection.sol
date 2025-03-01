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

contract AgenticAIAgentCollection is ERC721, EIP712, AccessControl, IAgenticAIAgentCollection {
    using ECDSA for bytes32;

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    string public baseURI;
    uint256 public nextTokenId;

    mapping(bytes32 => bool) public usedNonces;

    string private constant SIGNING_DOMAIN = "VerifiedMintNFT";
    string private constant SIGNATURE_VERSION = "1";

    struct MintRequest {
        address to;
        bytes32 nonce;
    }

    constructor()
        ERC721("AgenticAIAgentCollection", "AIAgent") 
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165, AccessControl) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    function addSigner(address signer) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SIGNER_ROLE, signer);
        emit SignerAdded(signer);
    }

    function removeSigner(address signer) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(SIGNER_ROLE, signer);
        emit SignerRemoved(signer);
    }

    function setBaseURI(string memory newBaseURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function mintWithSignature(
        address to,
        bytes32 nonce,
        bytes memory signature
    ) public {
        if (usedNonces[nonce]) {
            revert UsedNonce(nonce);
        }
        if (!_isValidSignature(to, nonce, signature)) {
            revert InvalidSignature(signature);
        }

        usedNonces[nonce] = true;
        _safeMint(to, nextTokenId);
        nextTokenId++;
    }

    function _isValidSignature(
        address to,
        bytes32 nonce,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("MintRequest(address to,bytes32 nonce)"),
            to,
            nonce
        )));

        address recoveredSigner = ECDSA.recover(digest, signature);
        return hasRole(SIGNER_ROLE, recoveredSigner);
    }
}
