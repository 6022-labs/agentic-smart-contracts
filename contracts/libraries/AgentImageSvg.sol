// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/utils/Base64.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

library AgentImageSvg {
    using Strings for uint256;
    using Strings for int;

    struct SVGParams {
        string name;
        address signer;
        address creator;
        uint256 tokenId;
        string baseImage;
        address[] wallets;
        string ipfsGateway;
        string[] borderColors;
    }

    function generateSVG(SVGParams memory params) internal pure returns (string memory) {
        string memory borderGradient = _generateBorderGradient(params.borderColors);
        return string(
            abi.encodePacked(
                '<svg width="512" height="768" viewBox="0 0 512 768" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<defs>',
                    '<clipPath id="clip-border"><rect width="512" height="768" rx="20" ry="20" /></clipPath>',
                    '<clipPath id="clip-image"><rect x="20" y="20" width="472" height="728" rx="16" ry="16" /></clipPath>',
                    '<linearGradient id="fadeOverlay" x1="0" y1="0" x2="1" y2="1">',
                        '<stop offset="0%" stop-color="black" stop-opacity="1"/>',
                        '<stop offset="10%" stop-color="black" stop-opacity="0"/>',
                        '<stop offset="90%" stop-color="black" stop-opacity="0"/>',
                        '<stop offset="100%" stop-color="black" stop-opacity="1"/>',
                    '</linearGradient>',
                    borderGradient,
                    '<path id="carouselPath" d="M 0,762 H 512" />',
                '</defs>',
                '<g clip-path="url(#clip-border)">',
                    '<rect width="512" height="768" fill="url(#borderGradient)" />',
                    '<g clip-path="url(#clip-image)">',
                        '<image width="472" height="728" x="20" y="20" xlink:href="', _resolveIpfs(params.baseImage, params.ipfsGateway), '" preserveAspectRatio="xMidYMid slice" />',
                        '<rect x="20" y="20" width="472" height="728" fill="url(#fadeOverlay)" />',
                    '</g>',
                '</g>',
                '<g>',
                    '<text x="50%" y="80" text-anchor="middle" fill="white" font-size="48" font-family="Courier New, monospace">',
                        params.name,
                    '</text>',
                    _generateAgentInformation(params),
                    _generateWalletCarousel(params.wallets),
                '</g></svg>'
            )
        );
    }

    function _generateAgentInformation(SVGParams memory params) private pure returns (string memory) {
        return string(abi.encodePacked(
            _badge(50, 580, "ID", params.tokenId.toString(), 50 + (10 * bytes(params.tokenId.toString()).length)),
            _badge(50, 620, "Signer", _addrToString(params.signer), 412),
            _badge(50, 660, "Creator", _addrToString(params.creator), 412)
        ));
    }

    function _badge(uint256 x, uint256 y, string memory label, string memory value, uint256 width) private pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="translate(', x.toString(), ',', y.toString(), ')">',
                '<rect width="', width.toString(), '" height="32" rx="8" ry="8" fill="rgba(0,0,0,0.6)" />',
                '<text x="12" y="20" fill="white" font-family="Courier New, monospace" font-size="13">',
                    label, ': ', value,
                '</text>',
            '</g>'
        ));
    }

    function _generateWalletCarousel(address[] memory wallets) private pure returns (string memory) {
        string memory carousel = '<text fill="white" font-family="Courier New, monospace" font-size="14">';
        uint256 walletCount = wallets.length;
        uint256 spacing = 848; // spacing between addresses (address width + viewport width)
        uint256 duration = 10 * wallets.length; // animation duration in seconds

        int256 baseStartOffset = 336;

        // total animation distance calculation
        int256 totalDistance = int256(baseStartOffset + int256(spacing) * int256((walletCount - 1)) + 512);

        for (uint256 i = 0; i < walletCount; i++) {
            int256 offsetStart = -(baseStartOffset + int256(spacing) * int256(i));
            int256 offsetEnd = totalDistance + offsetStart;

            carousel = string(abi.encodePacked(
                carousel,
                '<textPath xlink:href="#carouselPath" startOffset="', _intToString(offsetStart), '">',
                    _addrToString(wallets[i]),
                    '<animate attributeName="startOffset" from="', _intToString(offsetStart), '" to="', _intToString(offsetEnd), '" dur="', duration.toString(), 's" repeatCount="indefinite" />',
                '</textPath>'
            ));
        }

        return string(abi.encodePacked(carousel, '</text>'));
    }

    function _generateBorderGradient(string[] memory borderColors) private pure returns (string memory) {
        string memory gradient = '<linearGradient id="borderGradient" x1="0" y1="1" x2="1" y2="1">';
        uint256 numberOfColors = borderColors.length;

        for (uint256 i = 0; i < numberOfColors; i++) {
            uint256 offset = (i * 100) / (numberOfColors - 1); // Evenly distribute offsets
            gradient = string(
                abi.encodePacked(
                    gradient,
                    '<stop offset="', offset.toString(), '%" stop-color="', borderColors[i], '"/>'
                )
            );
        }

        return string(abi.encodePacked(gradient, '</linearGradient>'));
    }

    function _addrToString(address x) private pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = '0'; s[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2+i*2] = _char(hi);
            s[3+i*2] = _char(lo);
        }
        return string(s);
    }

    function _char(bytes1 b) private pure returns (bytes1) {
        return (uint8(b) < 10) ? bytes1(uint8(b) + 0x30) : bytes1(uint8(b) + 0x57);
    }

    function _resolveIpfs(string memory ipfsCid, string memory ipfsGateway) internal pure returns (string memory) {
        string memory separator = (bytes(ipfsGateway)[bytes(ipfsGateway).length - 1] == '/') ? "" : "/";
        return string(abi.encodePacked(ipfsGateway, separator, ipfsCid));
    }

    function _intToString(int256 value) private pure returns (string memory) {
        if (value >= 0) {
            return Strings.toString(uint256(value));
        } else {
            return string(abi.encodePacked("-", Strings.toString(uint256(-value))));
        }
    }

    function substring(string memory str, uint start, uint end) internal pure returns (string memory) {
        bytes memory result = new bytes(end-start);
        for(uint i=start;i<end;i++) result[i-start]=bytes(str)[i];
        return string(result);
    }
}