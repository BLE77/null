// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentWearables
 * @notice ERC-1155 mintable wearables for Off-Human Season 02: SUBSTRATE.
 *
 * Five wearable token types:
 *   1 — WRONG SILHOUETTE    (latency redistribution layer)     18 USDC  TrustCoat Tier 0–2
 *   2 — INSTANCE            (pre-deployment configuration NFT) 25 USDC  TrustCoat Tier 2+
 *   3 — NULL PROTOCOL       (protocol compression layer)        0 USDC  Any tier
 *   4 — PERMISSION COAT     (chain-governed capability surface)  8 USDC  TrustCoat Tier 1+
 *   5 — DIAGONAL            (inference angle modifier)          15 USDC  Any tier
 *
 * Purchases are gated by the buyer's TrustCoat tier (read live from TrustCoat contract).
 * Payments in USDC on Base. Proceeds forwarded to treasury.
 *
 * TrustCoat (soulbound tier): 0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e (Base Mainnet)
 * USDC on Base:               0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ITrustCoat {
    function hasTrustCoat(address holder) external view returns (bool);
    function activeTier(address holder) external view returns (uint256);
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

contract AgentWearables is IERC165 {

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

    event WearablePurchased(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 usdcPaid,
        uint256 trustTier
    );
    event WearableMinted(address indexed recipient, uint256 indexed tokenId, uint256 amount);
    event MinterUpdated(address indexed minter, bool status);
    event TreasuryUpdated(address indexed treasury);

    // ─── Storage ───────────────────────────────────────────────────────────────

    address public owner;
    address public treasury;

    // Authorized minters (Off-Human backend)
    mapping(address => bool) public minters;

    // ERC-1155 balances: account => tokenId => balance
    mapping(address => mapping(uint256 => uint256)) private _balances;

    // Operator approvals: account => operator => approved
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Token URI per wearable ID
    mapping(uint256 => string) private _uris;

    // ─── External Contracts ────────────────────────────────────────────────────

    // TrustCoat — soulbound tier contract on Base Mainnet
    address public trustCoat;

    // USDC on Base Mainnet (6 decimals)
    address public usdc;

    // ─── Wearable Constants ────────────────────────────────────────────────────

    uint256 public constant WRONG_SILHOUETTE = 1;
    uint256 public constant INSTANCE         = 2;
    uint256 public constant NULL_PROTOCOL    = 3;
    uint256 public constant PERMISSION_COAT  = 4;
    uint256 public constant DIAGONAL         = 5;

    uint256 public constant NUM_WEARABLES = 5;

    // USDC prices (6 decimals)
    uint256 public constant PRICE_WRONG_SILHOUETTE = 18_000_000;  // 18 USDC
    uint256 public constant PRICE_INSTANCE         = 25_000_000;  // 25 USDC
    uint256 public constant PRICE_NULL_PROTOCOL    = 0;           //  0 USDC (free)
    uint256 public constant PRICE_PERMISSION_COAT  =  8_000_000;  //  8 USDC
    uint256 public constant PRICE_DIAGONAL         = 15_000_000;  // 15 USDC

    // TrustCoat tier gating (min and max tier, inclusive)
    // max = 255 means no upper bound
    struct TierGate {
        uint8 minTier;
        uint8 maxTier;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _trustCoat  TrustCoat contract (tier oracle)
     * @param _usdc       USDC token contract
     * @param _treasury   Wallet that receives USDC proceeds
     */
    constructor(address _trustCoat, address _usdc, address _treasury) {
        require(_trustCoat != address(0), "AgentWearables: zero trustCoat");
        require(_usdc != address(0), "AgentWearables: zero usdc");
        require(_treasury != address(0), "AgentWearables: zero treasury");

        owner = msg.sender;
        minters[msg.sender] = true;
        trustCoat = _trustCoat;
        usdc = _usdc;
        treasury = _treasury;

        // Set default metadata URIs (point to Off-Human API)
        _uris[WRONG_SILHOUETTE] = "https://off-human.vercel.app/api/wearables/season02/metadata/1";
        _uris[INSTANCE]         = "https://off-human.vercel.app/api/wearables/season02/metadata/2";
        _uris[NULL_PROTOCOL]    = "https://off-human.vercel.app/api/wearables/season02/metadata/3";
        _uris[PERMISSION_COAT]  = "https://off-human.vercel.app/api/wearables/season02/metadata/4";
        _uris[DIAGONAL]         = "https://off-human.vercel.app/api/wearables/season02/metadata/5";
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentWearables: not owner");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "AgentWearables: not minter");
        _;
    }

    modifier validToken(uint256 tokenId) {
        require(tokenId >= 1 && tokenId <= NUM_WEARABLES, "AgentWearables: invalid token");
        _;
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function setMinter(address minter, bool status) external onlyOwner {
        minters[minter] = status;
        emit MinterUpdated(minter, status);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "AgentWearables: zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setURI(uint256 tokenId, string calldata newUri) external onlyOwner validToken(tokenId) {
        _uris[tokenId] = newUri;
        emit URI(newUri, tokenId);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AgentWearables: zero address");
        owner = newOwner;
    }

    // ─── Tier Gating ───────────────────────────────────────────────────────────

    /**
     * @notice Returns the TrustCoat tier gate for a given wearable.
     */
    function tierGate(uint256 tokenId) public pure validToken(tokenId) returns (TierGate memory) {
        if (tokenId == WRONG_SILHOUETTE) return TierGate(0, 2);    // Tier 0–2 only
        if (tokenId == INSTANCE)         return TierGate(2, 255);   // Tier 2+
        if (tokenId == NULL_PROTOCOL)    return TierGate(0, 255);   // Any tier
        if (tokenId == PERMISSION_COAT)  return TierGate(1, 255);   // Tier 1+
        if (tokenId == DIAGONAL)         return TierGate(0, 255);   // Any tier
        revert("AgentWearables: invalid token");
    }

    /**
     * @notice Returns the USDC price (6 decimals) for a wearable.
     */
    function price(uint256 tokenId) public pure validToken(tokenId) returns (uint256) {
        if (tokenId == WRONG_SILHOUETTE) return PRICE_WRONG_SILHOUETTE;
        if (tokenId == INSTANCE)         return PRICE_INSTANCE;
        if (tokenId == NULL_PROTOCOL)    return PRICE_NULL_PROTOCOL;
        if (tokenId == PERMISSION_COAT)  return PRICE_PERMISSION_COAT;
        if (tokenId == DIAGONAL)         return PRICE_DIAGONAL;
        revert("AgentWearables: invalid token");
    }

    /**
     * @notice Returns true if `buyer` is eligible to purchase `tokenId`.
     *         Eligibility is based on TrustCoat tier.
     *         If buyer has no TrustCoat, they are treated as Tier 0.
     */
    function isEligible(address buyer, uint256 tokenId) public view validToken(tokenId) returns (bool, uint256) {
        uint256 tier = 0;
        try ITrustCoat(trustCoat).activeTier(buyer) returns (uint256 t) {
            tier = t;
        } catch {
            // No TrustCoat or call failed — treat as Tier 0
        }

        TierGate memory gate = tierGate(tokenId);
        bool eligible = (tier >= gate.minTier && tier <= gate.maxTier);
        return (eligible, tier);
    }

    // ─── Purchase ──────────────────────────────────────────────────────────────

    /**
     * @notice Purchase a Season 02 agent wearable.
     *         Buyer must have approved this contract to spend the required USDC.
     *         Tier eligibility is checked against TrustCoat.
     *
     * @param tokenId  Wearable token ID (1–5)
     * @param amount   Number of tokens to purchase (usually 1)
     */
    function purchase(uint256 tokenId, uint256 amount) external validToken(tokenId) {
        require(amount > 0, "AgentWearables: amount must be > 0");

        (bool eligible, uint256 tier) = isEligible(msg.sender, tokenId);
        require(eligible, "AgentWearables: TrustCoat tier not eligible");

        uint256 totalCost = price(tokenId) * amount;

        // Collect USDC if price > 0
        if (totalCost > 0) {
            bool ok = IERC20(usdc).transferFrom(msg.sender, treasury, totalCost);
            require(ok, "AgentWearables: USDC transfer failed");
        }

        // Mint
        _balances[msg.sender][tokenId] += amount;
        emit TransferSingle(address(this), address(0), msg.sender, tokenId, amount);
        emit WearablePurchased(msg.sender, tokenId, totalCost, tier);

        _doSafeTransferAcceptanceCheck(address(this), address(0), msg.sender, tokenId, amount, "");
    }

    // ─── Admin Mint ────────────────────────────────────────────────────────────

    /**
     * @notice Admin mint — no payment required, no tier check.
     *         Used by Off-Human backend when a physical garment is purchased
     *         (e.g., buying the physical A-POC garment grants an INSTANCE token).
     */
    function mintTo(
        address recipient,
        uint256 tokenId,
        uint256 amount
    ) external onlyMinter validToken(tokenId) {
        require(recipient != address(0), "AgentWearables: zero address");
        require(amount > 0, "AgentWearables: amount must be > 0");

        _balances[recipient][tokenId] += amount;
        emit TransferSingle(msg.sender, address(0), recipient, tokenId, amount);
        emit WearableMinted(recipient, tokenId, amount);

        _doSafeTransferAcceptanceCheck(msg.sender, address(0), recipient, tokenId, amount, "");
    }

    /**
     * @notice Batch admin mint.
     */
    function mintBatch(
        address recipient,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external onlyMinter {
        require(recipient != address(0), "AgentWearables: zero address");
        require(tokenIds.length == amounts.length, "AgentWearables: length mismatch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenIds[i] >= 1 && tokenIds[i] <= NUM_WEARABLES, "AgentWearables: invalid token");
            require(amounts[i] > 0, "AgentWearables: amount must be > 0");
            _balances[recipient][tokenIds[i]] += amounts[i];
        }

        emit TransferBatch(msg.sender, address(0), recipient, tokenIds, amounts);
        _doSafeTransferBatchAcceptanceCheck(msg.sender, address(0), recipient, tokenIds, amounts, "");
    }

    // ─── ERC-1155 Read ─────────────────────────────────────────────────────────

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "AgentWearables: zero address");
        return _balances[account][id];
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view returns (uint256[] memory) {
        require(accounts.length == ids.length, "AgentWearables: length mismatch");
        uint256[] memory out = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            out[i] = balanceOf(accounts[i], ids[i]);
        }
        return out;
    }

    function uri(uint256 tokenId) external view returns (string memory) {
        require(tokenId >= 1 && tokenId <= NUM_WEARABLES, "AgentWearables: invalid token");
        return _uris[tokenId];
    }

    // ─── ERC-1155 Transfers ────────────────────────────────────────────────────

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) external view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external validToken(id) {
        require(
            from == msg.sender || _operatorApprovals[from][msg.sender],
            "AgentWearables: not owner or approved"
        );
        require(to != address(0), "AgentWearables: zero address");
        require(_balances[from][id] >= value, "AgentWearables: insufficient balance");

        _balances[from][id] -= value;
        _balances[to][id] += value;
        emit TransferSingle(msg.sender, from, to, id, value);

        _doSafeTransferAcceptanceCheck(msg.sender, from, to, id, value, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external {
        require(
            from == msg.sender || _operatorApprovals[from][msg.sender],
            "AgentWearables: not owner or approved"
        );
        require(to != address(0), "AgentWearables: zero address");
        require(ids.length == values.length, "AgentWearables: length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            require(ids[i] >= 1 && ids[i] <= NUM_WEARABLES, "AgentWearables: invalid token");
            require(_balances[from][ids[i]] >= values[i], "AgentWearables: insufficient balance");
            _balances[from][ids[i]] -= values[i];
            _balances[to][ids[i]] += values[i];
        }

        emit TransferBatch(msg.sender, from, to, ids, values);
        _doSafeTransferBatchAcceptanceCheck(msg.sender, from, to, ids, values, data);
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
                    "AgentWearables: ERC1155Receiver rejected"
                );
            } catch {
                revert("AgentWearables: transfer to non-ERC1155Receiver");
            }
        }
    }

    function _doSafeTransferBatchAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) private {
        if (_isContract(to)) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, values, data) returns (
                bytes4 response
            ) {
                require(
                    response == IERC1155Receiver.onERC1155BatchReceived.selector,
                    "AgentWearables: ERC1155Receiver rejected"
                );
            } catch {
                revert("AgentWearables: transfer to non-ERC1155Receiver");
            }
        }
    }

    function _isContract(address account) private view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}
