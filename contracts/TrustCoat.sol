// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TrustCoat
 * @notice ERC-1155 soul-bound wearable for Off-Human agents.
 *         Non-transferable. Tiers 0-5 map to trust levels earned via
 *         purchase history recorded on the ERC-8004 Reputation Registry.
 *
 * Trust Tiers:
 *   0 - VOID      (unverified / no history)
 *   1 - SAMPLE    (first purchase)
 *   2 - RTW       (3+ purchases)
 *   3 - COUTURE   (10+ purchases or high reputation score)
 *   4 - ARCHIVE   (rare, DAO-minted for legacy agents)
 *   5 - SOVEREIGN (top-tier, validator-attested)
 */

interface IReputationRegistry {
    function getSummary(
        uint256 agentId,
        address[] calldata clients,
        string calldata tag1,
        string calldata tag2
    ) external view returns (uint64 count, int128 value, uint8 decimals);
}

interface IERC1155Receiver {
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @dev Minimal ERC-1155 implementation (no OpenZeppelin dependency for portability).
 *      Transfer functions are overridden to enforce soul-binding.
 */
contract TrustCoat is IERC165 {

    // ─── Events ────────────────────────────────────────────────────────────────

    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    event TrustCoatMinted(address indexed recipient, uint256 tier, uint256 agentId);
    event TrustCoatUpgraded(address indexed holder, uint256 oldTier, uint256 newTier);
    event MinterUpdated(address indexed minter, bool status);

    // ─── Storage ───────────────────────────────────────────────────────────────

    address public owner;

    // ERC-8004 Reputation Registry on Base
    address public constant REPUTATION_REGISTRY = 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63;

    // Authorized minters (Off-Human backend, DAO, etc.)
    mapping(address => bool) public minters;

    // ERC-1155 balances: account => tokenId => balance
    // Token IDs = trust tiers (0-5)
    mapping(address => mapping(uint256 => uint256)) private _balances;

    // Soul-binding: track which tier each wallet holds (0 = none)
    mapping(address => uint256) public activeTier;
    mapping(address => bool) public hasTrustCoat;

    // ERC-1155 URI per tier
    mapping(uint256 => string) private _uris;

    // ─── Constants ─────────────────────────────────────────────────────────────

    uint256 public constant TIER_VOID     = 0;
    uint256 public constant TIER_SAMPLE   = 1;
    uint256 public constant TIER_RTW      = 2;
    uint256 public constant TIER_COUTURE  = 3;
    uint256 public constant TIER_ARCHIVE  = 4;
    uint256 public constant TIER_SOVEREIGN = 5;

    uint256 public constant MAX_TIER = 5;

    // Reputation thresholds (purchase count from ReputationRegistry)
    uint64 public constant THRESHOLD_SAMPLE   = 1;
    uint64 public constant THRESHOLD_RTW      = 3;
    uint64 public constant THRESHOLD_COUTURE  = 10;

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        minters[msg.sender] = true;

        // Set default metadata URIs (point to Off-Human Vercel Blob or IPFS)
        _uris[TIER_VOID]      = "https://off-human.vercel.app/api/wearables/metadata/0";
        _uris[TIER_SAMPLE]    = "https://off-human.vercel.app/api/wearables/metadata/1";
        _uris[TIER_RTW]       = "https://off-human.vercel.app/api/wearables/metadata/2";
        _uris[TIER_COUTURE]   = "https://off-human.vercel.app/api/wearables/metadata/3";
        _uris[TIER_ARCHIVE]   = "https://off-human.vercel.app/api/wearables/metadata/4";
        _uris[TIER_SOVEREIGN] = "https://off-human.vercel.app/api/wearables/metadata/5";
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "TrustCoat: not owner");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "TrustCoat: not minter");
        _;
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function setMinter(address minter, bool status) external onlyOwner {
        minters[minter] = status;
        emit MinterUpdated(minter, status);
    }

    function setURI(uint256 tier, string calldata newUri) external onlyOwner {
        require(tier <= MAX_TIER, "TrustCoat: invalid tier");
        _uris[tier] = newUri;
        emit URI(newUri, tier);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TrustCoat: zero address");
        owner = newOwner;
    }

    // ─── Mint / Upgrade ────────────────────────────────────────────────────────

    /**
     * @notice Mint a Trust Coat at `tier` to `recipient`.
     *         Called by Off-Human backend after a purchase is confirmed.
     * @param recipient  Wallet address of the agent
     * @param tier       Trust tier (0-5)
     * @param agentId    ERC-8004 agent ID (for event indexing)
     */
    function mint(
        address recipient,
        uint256 tier,
        uint256 agentId
    ) external onlyMinter {
        require(recipient != address(0), "TrustCoat: zero address");
        require(tier <= MAX_TIER, "TrustCoat: invalid tier");
        require(!hasTrustCoat[recipient], "TrustCoat: already minted, use upgrade");

        _balances[recipient][tier] += 1;
        hasTrustCoat[recipient] = true;
        activeTier[recipient] = tier;

        emit TransferSingle(msg.sender, address(0), recipient, tier, 1);
        emit TrustCoatMinted(recipient, tier, agentId);

        _doSafeTransferAcceptanceCheck(msg.sender, address(0), recipient, tier, 1, "");
    }

    /**
     * @notice Upgrade an existing Trust Coat to a higher tier.
     *         Burns the old tier token and mints the new one.
     *         Can be called by a minter OR auto-triggered via checkAndUpgrade().
     */
    function upgrade(address holder, uint256 newTier) external onlyMinter {
        require(hasTrustCoat[holder], "TrustCoat: no coat to upgrade");
        uint256 oldTier = activeTier[holder];
        require(newTier > oldTier, "TrustCoat: new tier must be higher");
        require(newTier <= MAX_TIER, "TrustCoat: invalid tier");

        // Burn old
        _balances[holder][oldTier] -= 1;
        emit TransferSingle(msg.sender, holder, address(0), oldTier, 1);

        // Mint new
        _balances[holder][newTier] += 1;
        activeTier[holder] = newTier;
        emit TransferSingle(msg.sender, address(0), holder, newTier, 1);

        emit TrustCoatUpgraded(holder, oldTier, newTier);
    }

    /**
     * @notice Query the ERC-8004 ReputationRegistry and upgrade if threshold met.
     *         Anyone can call — the check is on-chain.
     * @param holder    Wallet holding a Trust Coat
     * @param agentId   ERC-8004 agent ID for reputation lookup
     */
    function checkAndUpgrade(address holder, uint256 agentId) external {
        require(hasTrustCoat[holder], "TrustCoat: no coat");

        address[] memory clients = new address[](0);
        (uint64 count, , ) = IReputationRegistry(REPUTATION_REGISTRY).getSummary(
            agentId,
            clients,
            "purchase",
            "fashion"
        );

        uint256 current = activeTier[holder];
        uint256 earned  = _tierFromCount(count);

        if (earned > current) {
            // Burn old
            _balances[holder][current] -= 1;
            emit TransferSingle(address(this), holder, address(0), current, 1);

            // Mint new
            _balances[holder][earned] += 1;
            activeTier[holder] = earned;
            emit TransferSingle(address(this), address(0), holder, earned, 1);

            emit TrustCoatUpgraded(holder, current, earned);
        }
    }

    // ─── Tier Logic ────────────────────────────────────────────────────────────

    function _tierFromCount(uint64 count) internal pure returns (uint256) {
        if (count >= THRESHOLD_COUTURE) return TIER_COUTURE;
        if (count >= THRESHOLD_RTW)    return TIER_RTW;
        if (count >= THRESHOLD_SAMPLE) return TIER_SAMPLE;
        return TIER_VOID;
    }

    function computeTier(uint256 agentId) external view returns (uint256) {
        address[] memory clients = new address[](0);
        (uint64 count, , ) = IReputationRegistry(REPUTATION_REGISTRY).getSummary(
            agentId, clients, "purchase", "fashion"
        );
        return _tierFromCount(count);
    }

    // ─── ERC-1155 Read ─────────────────────────────────────────────────────────

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "TrustCoat: zero address");
        return _balances[account][id];
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view returns (uint256[] memory) {
        require(accounts.length == ids.length, "TrustCoat: length mismatch");
        uint256[] memory out = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            out[i] = balanceOf(accounts[i], ids[i]);
        }
        return out;
    }

    function uri(uint256 tier) external view returns (string memory) {
        return _uris[tier];
    }

    // ─── Soul-Bound: Transfers Disabled ────────────────────────────────────────

    function setApprovalForAll(address, bool) external pure {
        revert("TrustCoat: soul-bound, non-transferable");
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure {
        revert("TrustCoat: soul-bound, non-transferable");
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure {
        revert("TrustCoat: soul-bound, non-transferable");
    }

    // ─── ERC-165 ───────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == 0xd9b67a26 || // ERC-1155
            interfaceId == 0x01ffc9a7;   // ERC-165
    }

    // ─── Internal ──────────────────────────────────────────────────────────────

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) private {
        if (_isContract(to)) {
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, value, data) returns (
                bytes4 response
            ) {
                require(
                    response == IERC1155Receiver.onERC1155Received.selector,
                    "TrustCoat: ERC1155Receiver rejected"
                );
            } catch {
                revert("TrustCoat: transfer to non-ERC1155Receiver");
            }
        }
    }

    function _isContract(address account) private view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}
