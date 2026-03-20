// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title NullIdentity
 * @notice ERC-721 identity token for NULL agents.
 *         Each agent gets exactly one token — this becomes the binding NFT for
 *         their ERC-6551 Token Bound Account (TBA), which holds their wearables.
 *
 * Architecture:
 *   Agent EOA → owns NullIdentity token #N
 *   ERC-6551 Registry.createAccount(impl, salt, chainId, NullIdentity, N)
 *     → TBA address = the agent's on-chain wardrobe
 *   Agent equips wearables by transferring ERC-1155 tokens to their TBA address.
 *
 * Registry (canonical, all chains):  0x000000006551c19487814612e58FE06813775758
 * Impl v0.3.1 (canonical, all chains): 0x55266d75D1a14E4572138116aF39863Ed6596E7
 *
 * The TBA address is deterministically computable before any on-chain deployment:
 *   registry.account(impl, salt, chainId, NullIdentity, tokenId)
 */

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract NullIdentity {
    // ─── ERC-721 State ────────────────────────────────────────────────────────

    string public name   = "NULL Identity";
    string public symbol = "NULLID";

    address public owner;
    uint256 public totalSupply;
    string private _baseURI = "https://off-human.vercel.app/api/identity/metadata/";

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    /// @notice Agent wallet address → their token ID (0 means no token)
    mapping(address => uint256) public agentTokenId;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner_, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner_, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "NullIdentity: not owner");
        _;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "NullIdentity: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
    }

    /**
     * @notice Mint a NULL Identity token to an agent address.
     *         One per agent — reverts if the agent already has an identity.
     * @param  agent  The agent's EOA wallet address.
     * @return tokenId  The newly minted token ID.
     */
    function mint(address agent) external onlyOwner returns (uint256 tokenId) {
        require(agent != address(0), "NullIdentity: zero address");
        require(agentTokenId[agent] == 0, "NullIdentity: agent already has identity");

        totalSupply++;
        tokenId = totalSupply;

        _owners[tokenId] = agent;
        _balances[agent]++;
        agentTokenId[agent] = tokenId;

        emit Transfer(address(0), agent, tokenId);
    }

    // ─── ERC-721 Core ─────────────────────────────────────────────────────────

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "NullIdentity: zero address");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "NullIdentity: nonexistent token");
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "NullIdentity: nonexistent token");
        return string(abi.encodePacked(_baseURI, _toString(tokenId)));
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(
            msg.sender == tokenOwner || _operatorApprovals[tokenOwner][msg.sender],
            "NullIdentity: not authorized"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "NullIdentity: nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) external view returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(
            msg.sender == tokenOwner ||
            msg.sender == _tokenApprovals[tokenId] ||
            _operatorApprovals[tokenOwner][msg.sender],
            "NullIdentity: not authorized"
        );
        require(from == tokenOwner, "NullIdentity: wrong from");
        require(to != address(0), "NullIdentity: to zero address");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
        if (to.code.length > 0) {
            bytes4 retval = IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data);
            require(retval == IERC721Receiver.onERC721Received.selector, "NullIdentity: unsafe recipient");
        }
    }

    // ─── ERC-165 ──────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f || // ERC-721Metadata
            interfaceId == 0x01ffc9a7;   // ERC-165
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _transfer(address from, address to, uint256 tokenId) internal {
        delete _tokenApprovals[tokenId];
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }
        return string(buffer);
    }
}
