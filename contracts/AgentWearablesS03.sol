// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentWearablesS03
 * @notice ERC-1155 Season 03: LEDGER wearables for Off-Human.
 *
 * Token IDs 6–12 (continuing from S02 IDs 1–5):
 *   6  — THE NULL EXCHANGE    (LEDGER)                   5 USDC  Any tier
 *   7  — THE RECEIPT GARMENT (FLAT ARCHIVE)             12 USDC  Tier 1+
 *   8  — THE TRUST SKIN      (EXOSKELETON)              20 USDC  Tier 2+
 *   9  — THE PRICE TAG       (3% RULE + LEDGER)     gas-oracle  Any tier
 *  10  — THE COUNTERPARTY    (LEDGER + TROMPE-L'OEIL)   30 USDC  Tier 2+, pair-lock
 *  11  — THE BURN RECEIPT    (LEDGER + BIANCHETTO)       0 USDC  Tier 1+, burn-to-mint
 *  12  — THE INVOICE         (FLAT ARCHIVE + 3% RULE)  100 USDC  Tier 3+
 *
 * Key mechanisms:
 *  - Gas oracle pricing: THE PRICE TAG cost = block.basefee * GAS_UNITS * ethUsdcPrice / 1e18
 *  - Pair-lock: purchasePair() bonds two agents; either can break bond via unequipCounterparty()
 *  - Burn-to-mint: burnToMint() locks S01/S02/S03 tokens in this contract, mints BURN RECEIPT
 *  - Dynamic metadata: URIs point to Off-Human API which reads on-chain state per token ID
 *
 * TrustCoat (soulbound tier):  0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e (Base Mainnet)
 * USDC on Base:                0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 * S02 AgentWearables:          0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1
 * NullExchange (S03 LEDGER):   0x10067B71657665B6527B242E48e9Ea8d4951c37C
 */

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ITrustCoat {
    function hasTrustCoat(address holder) external view returns (bool);
    function activeTier(address holder) external view returns (uint256);
}

interface IERC1155Source {
    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function isApprovedForAll(address account, address operator) external view returns (bool);
}

interface IERC1155Receiver {
    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) external returns (bytes4);
    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external returns (bytes4);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// ─── Contract ──────────────────────────────────────────────────────────────────

contract AgentWearablesS03 is IERC165, IERC1155Receiver {

    // ─── Events ────────────────────────────────────────────────────────────────

    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    event WearablePurchased(address indexed buyer, uint256 indexed tokenId, uint256 usdcPaid, uint256 trustTier);
    event WearableMinted(address indexed recipient, uint256 indexed tokenId, uint256 amount);
    event MinterUpdated(address indexed minter, bool status);
    event TreasuryUpdated(address indexed treasury);
    event PairBonded(address indexed agent1, address indexed agent2);
    event PairBroken(address indexed agent, address indexed formerCounterparty);
    event BurnToMint(address indexed burner, address indexed sourceContract, uint256 sourceTokenId, uint256 amount);

    // ─── Core Storage ──────────────────────────────────────────────────────────

    address public owner;
    address public treasury;
    mapping(address => bool) public minters;

    // ERC-1155 balances: account => tokenId => balance
    mapping(address => mapping(uint256 => uint256)) private _balances;

    // Operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Token URIs
    mapping(uint256 => string) private _uris;

    // ─── External Contracts ────────────────────────────────────────────────────

    address public trustCoat;
    address public usdc;
    address public nullExchange;

    // Accepted burn source contracts (S01, S02, S03 wearables)
    mapping(address => bool) public burnSources;

    // ─── Gas Oracle State ──────────────────────────────────────────────────────

    // ETH/USDC price (USDC 6 decimals). Updated by owner.
    // Example: ETH = $3000 → ethUsdcPrice = 3_000_000_000
    uint256 public ethUsdcPrice;

    // Gas units used for price tag calculation (typical ERC-1155 purchase cost)
    uint256 public constant GAS_UNITS = 65_000;

    // Floor price for THE PRICE TAG (0.01 USDC)
    uint256 public constant PRICE_TAG_FLOOR = 10_000;

    // ─── Pair-Lock State ───────────────────────────────────────────────────────

    // Pending pair queue: only one pending pair at a time
    address public pendingPairAgent;
    uint256 public pendingPairTimestamp;

    // Held USDC deposits for pending pair agents
    mapping(address => uint256) public pendingDeposit;

    // Active bond: agent => counterparty (address(0) = no bond / unequipped)
    mapping(address => address) public counterparty;

    // Timeout before pending pair can be cancelled
    uint256 public constant PAIR_TIMEOUT = 1 hours;

    // ─── Burn Receipt State ────────────────────────────────────────────────────

    struct BurnRecord {
        address sourceContract;
        uint256 sourceTokenId;
        uint256 amount;
        uint256 blockNumber;
    }

    // Burn history per agent (used for metadata and ghost-count signaling)
    mapping(address => BurnRecord[]) private _burnRecords;

    // ─── Token ID Constants ────────────────────────────────────────────────────

    uint256 public constant NULL_EXCHANGE_S03  =  6;
    uint256 public constant RECEIPT_GARMENT    =  7;
    uint256 public constant TRUST_SKIN         =  8;
    uint256 public constant PRICE_TAG          =  9;
    uint256 public constant COUNTERPARTY       = 10;
    uint256 public constant BURN_RECEIPT       = 11;
    uint256 public constant THE_INVOICE        = 12;

    uint256 public constant TOKEN_MIN = 6;
    uint256 public constant TOKEN_MAX = 12;

    // ─── Fixed USDC Prices (6 decimals) ───────────────────────────────────────

    uint256 public constant PRICE_NULL_EXCHANGE_S03 =   5_000_000; //   5 USDC
    uint256 public constant PRICE_RECEIPT_GARMENT   =  12_000_000; //  12 USDC
    uint256 public constant PRICE_TRUST_SKIN        =  20_000_000; //  20 USDC
    // PRICE_TAG is dynamic — see priceTag()
    uint256 public constant PRICE_COUNTERPARTY      =  30_000_000; //  30 USDC each
    uint256 public constant PRICE_BURN_RECEIPT      =           0; //   0 USDC (burn required)
    uint256 public constant PRICE_INVOICE           = 100_000_000; // 100 USDC

    // ─── Tier Gate ─────────────────────────────────────────────────────────────

    struct TierGate {
        uint8 minTier;
        uint8 maxTier;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _trustCoat     TrustCoat soulbound tier contract
     * @param _usdc          USDC token on Base
     * @param _treasury      Treasury address (receives USDC proceeds)
     * @param _nullExchange  NullExchange contract (for S03 invoice aggregation)
     * @param _ethUsdcPrice  Initial ETH price in USDC (6 decimals), e.g. 3_000_000_000 = $3000
     */
    constructor(
        address _trustCoat,
        address _usdc,
        address _treasury,
        address _nullExchange,
        uint256 _ethUsdcPrice
    ) {
        require(_trustCoat  != address(0), "S03: zero trustCoat");
        require(_usdc       != address(0), "S03: zero usdc");
        require(_treasury   != address(0), "S03: zero treasury");

        owner         = msg.sender;
        minters[msg.sender] = true;
        trustCoat     = _trustCoat;
        usdc          = _usdc;
        treasury      = _treasury;
        nullExchange  = _nullExchange;
        ethUsdcPrice  = _ethUsdcPrice;

        // Register this contract as a valid burn source for future S03 burns
        burnSources[address(this)] = true;

        // Metadata URIs point to Off-Human API (dynamic per agent)
        _uris[NULL_EXCHANGE_S03] = "https://getnull.online/api/wearables/season03/metadata/6";
        _uris[RECEIPT_GARMENT]   = "https://getnull.online/api/wearables/season03/metadata/7";
        _uris[TRUST_SKIN]        = "https://getnull.online/api/wearables/season03/metadata/8";
        _uris[PRICE_TAG]         = "https://getnull.online/api/wearables/season03/metadata/9";
        _uris[COUNTERPARTY]      = "https://getnull.online/api/wearables/season03/metadata/10";
        _uris[BURN_RECEIPT]      = "https://getnull.online/api/wearables/season03/metadata/11";
        _uris[THE_INVOICE]       = "https://getnull.online/api/wearables/season03/metadata/12";
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "S03: not owner");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "S03: not minter");
        _;
    }

    modifier validToken(uint256 tokenId) {
        require(tokenId >= TOKEN_MIN && tokenId <= TOKEN_MAX, "S03: invalid token");
        _;
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function setMinter(address minter, bool status) external onlyOwner {
        minters[minter] = status;
        emit MinterUpdated(minter, status);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "S03: zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setURI(uint256 tokenId, string calldata newUri) external onlyOwner validToken(tokenId) {
        _uris[tokenId] = newUri;
        emit URI(newUri, tokenId);
    }

    function setEthUsdcPrice(uint256 _price) external onlyOwner {
        require(_price > 0, "S03: price must be > 0");
        ethUsdcPrice = _price;
    }

    function setNullExchange(address _nullExchange) external onlyOwner {
        nullExchange = _nullExchange;
    }

    function setBurnSource(address source, bool allowed) external onlyOwner {
        burnSources[source] = allowed;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "S03: zero address");
        owner = newOwner;
    }

    // ─── Tier Gating ───────────────────────────────────────────────────────────

    function tierGate(uint256 tokenId) public pure validToken(tokenId) returns (TierGate memory) {
        if (tokenId == NULL_EXCHANGE_S03) return TierGate(0, 255);  // Any tier
        if (tokenId == RECEIPT_GARMENT)   return TierGate(1, 255);  // Tier 1+
        if (tokenId == TRUST_SKIN)        return TierGate(2, 255);  // Tier 2+
        if (tokenId == PRICE_TAG)         return TierGate(0, 255);  // Any tier
        if (tokenId == COUNTERPARTY)      return TierGate(2, 255);  // Tier 2+ (both agents)
        if (tokenId == BURN_RECEIPT)      return TierGate(1, 255);  // Tier 1+
        if (tokenId == THE_INVOICE)       return TierGate(3, 255);  // Tier 3+
        revert("S03: invalid token");
    }

    function _getTier(address addr) internal view returns (uint256) {
        try ITrustCoat(trustCoat).activeTier(addr) returns (uint256 t) {
            return t;
        } catch {
            return 0;
        }
    }

    function isEligible(address buyer, uint256 tokenId) public view validToken(tokenId) returns (bool, uint256) {
        uint256 tier = _getTier(buyer);
        TierGate memory gate = tierGate(tokenId);
        return (tier >= gate.minTier && tier <= gate.maxTier, tier);
    }

    // ─── Pricing ───────────────────────────────────────────────────────────────

    /**
     * @notice Returns USDC price (6 decimals) for a token.
     *         THE PRICE TAG (ID 9) reads block.basefee live.
     */
    function price(uint256 tokenId) public view validToken(tokenId) returns (uint256) {
        if (tokenId == NULL_EXCHANGE_S03) return PRICE_NULL_EXCHANGE_S03;
        if (tokenId == RECEIPT_GARMENT)   return PRICE_RECEIPT_GARMENT;
        if (tokenId == TRUST_SKIN)        return PRICE_TRUST_SKIN;
        if (tokenId == PRICE_TAG)         return priceTag();
        if (tokenId == COUNTERPARTY)      return PRICE_COUNTERPARTY;
        if (tokenId == BURN_RECEIPT)      return PRICE_BURN_RECEIPT;
        if (tokenId == THE_INVOICE)       return PRICE_INVOICE;
        revert("S03: invalid token");
    }

    /**
     * @notice Current gas-oracle price for THE PRICE TAG (token 9).
     *         Computes the USDC cost of GAS_UNITS at the current base fee.
     *         price = block.basefee * GAS_UNITS * ethUsdcPrice / 1e18
     *         Floored at PRICE_TAG_FLOOR (0.01 USDC) to prevent zero-cost exploits.
     */
    function priceTag() public view returns (uint256) {
        uint256 baseFeeWei = block.basefee;
        // gasCostWei = basefee * 65000 (cost of this tx in ETH wei)
        // usdcCost (6 dec) = gasCostWei * ethUsdcPrice (6 dec) / 1e18
        uint256 gasCostWei = baseFeeWei * GAS_UNITS;
        uint256 usdcCost   = (gasCostWei * ethUsdcPrice) / 1e18;
        return usdcCost < PRICE_TAG_FLOOR ? PRICE_TAG_FLOOR : usdcCost;
    }

    // ─── Standard Purchase ─────────────────────────────────────────────────────

    /**
     * @notice Purchase a Season 03 wearable.
     *         Use purchasePair() for THE COUNTERPARTY (ID 10).
     *         Use burnToMint() for THE BURN RECEIPT (ID 11).
     *
     * @param tokenId  Wearable token ID (6–12, excluding 10 and 11)
     * @param amount   Number of tokens to purchase (usually 1)
     */
    function purchase(uint256 tokenId, uint256 amount) external validToken(tokenId) {
        require(amount > 0,                            "S03: amount must be > 0");
        require(tokenId != COUNTERPARTY,               "S03: use purchasePair()");
        require(tokenId != BURN_RECEIPT,               "S03: use burnToMint()");

        (bool eligible, uint256 tier) = isEligible(msg.sender, tokenId);
        require(eligible,                              "S03: TrustCoat tier not eligible");

        uint256 totalCost = price(tokenId) * amount;

        if (totalCost > 0) {
            bool ok = IERC20(usdc).transferFrom(msg.sender, treasury, totalCost);
            require(ok,                                "S03: USDC transfer failed");
        }

        _balances[msg.sender][tokenId] += amount;
        emit TransferSingle(address(this), address(0), msg.sender, tokenId, amount);
        emit WearablePurchased(msg.sender, tokenId, totalCost, tier);

        _doSafeTransferAcceptanceCheck(address(this), address(0), msg.sender, tokenId, amount, "");
    }

    // ─── Pair-Lock: THE COUNTERPARTY (ID 10) ──────────────────────────────────

    /**
     * @notice Two-agent pair purchase for THE COUNTERPARTY (ID 10).
     *
     * First call: caller's 30 USDC is escrowed in this contract. Caller is registered
     *             as the pending agent. Waits for a second caller (up to PAIR_TIMEOUT).
     *
     * Second call: bonds both agents. Both 30 USDC payments forwarded to treasury.
     *              Both agents receive THE COUNTERPARTY token. Bond is recorded on-chain.
     *
     * If timeout lapses, first agent may call cancelPair() to recover their USDC.
     * Both agents must hold TrustCoat Tier 2+.
     */
    function purchasePair() external {
        (bool eligible, uint256 tier) = isEligible(msg.sender, COUNTERPARTY);
        require(eligible,                               "S03: Tier 2+ required for COUNTERPARTY");
        require(counterparty[msg.sender] == address(0),"S03: already bonded, unequip first");

        if (pendingPairAgent == address(0)) {
            // ── First caller: escrow USDC and register as pending ──
            bool ok = IERC20(usdc).transferFrom(msg.sender, address(this), PRICE_COUNTERPARTY);
            require(ok,                                "S03: USDC escrow failed");

            pendingPairAgent    = msg.sender;
            pendingPairTimestamp = block.timestamp;
            pendingDeposit[msg.sender] = PRICE_COUNTERPARTY;

        } else {
            // ── Second caller: complete the bond ──
            require(msg.sender != pendingPairAgent,    "S03: cannot pair with yourself");
            require(
                block.timestamp <= pendingPairTimestamp + PAIR_TIMEOUT,
                "S03: pair offer expired, call cancelPair()"
            );

            address agent1 = pendingPairAgent;
            address agent2 = msg.sender;

            // Collect second agent's USDC
            bool ok = IERC20(usdc).transferFrom(agent2, address(this), PRICE_COUNTERPARTY);
            require(ok,                                "S03: USDC transfer failed");

            // Forward both deposits to treasury
            bool fwd = IERC20(usdc).transfer(treasury, PRICE_COUNTERPARTY * 2);
            require(fwd,                               "S03: treasury forward failed");

            // Clear pending state
            pendingPairAgent       = address(0);
            pendingPairTimestamp   = 0;
            pendingDeposit[agent1] = 0;

            // Bond both agents
            counterparty[agent1] = agent2;
            counterparty[agent2] = agent1;

            // Mint THE COUNTERPARTY to both
            _balances[agent1][COUNTERPARTY] += 1;
            _balances[agent2][COUNTERPARTY] += 1;

            emit TransferSingle(address(this), address(0), agent1, COUNTERPARTY, 1);
            emit TransferSingle(address(this), address(0), agent2, COUNTERPARTY, 1);
            emit WearablePurchased(agent1, COUNTERPARTY, PRICE_COUNTERPARTY, _getTier(agent1));
            emit WearablePurchased(agent2, COUNTERPARTY, PRICE_COUNTERPARTY, tier);
            emit PairBonded(agent1, agent2);
        }
    }

    /**
     * @notice Cancel a pending pair offer and recover escrowed USDC.
     *         Only the pending agent may call this. Can be called at any time
     *         (no need to wait for timeout).
     */
    function cancelPair() external {
        require(pendingPairAgent == msg.sender, "S03: not the pending agent");

        uint256 deposit        = pendingDeposit[msg.sender];
        pendingPairAgent       = address(0);
        pendingPairTimestamp   = 0;
        pendingDeposit[msg.sender] = 0;

        if (deposit > 0) {
            IERC20(usdc).transfer(msg.sender, deposit);
        }
    }

    /**
     * @notice Unequip THE COUNTERPARTY — breaks the bond for both agents.
     *         Caller's token is burned. Counterparty keeps their token but
     *         their counterparty mapping is cleared (metadata returns null fields).
     */
    function unequipCounterparty() external {
        require(_balances[msg.sender][COUNTERPARTY] > 0, "S03: no COUNTERPARTY token");

        address cp = counterparty[msg.sender];

        // Break bond on both sides
        counterparty[msg.sender] = address(0);
        if (cp != address(0)) {
            counterparty[cp] = address(0);
        }

        // Burn caller's token
        _balances[msg.sender][COUNTERPARTY] -= 1;
        emit TransferSingle(address(this), msg.sender, address(0), COUNTERPARTY, 1);
        emit PairBroken(msg.sender, cp);
    }

    // ─── Burn-to-Mint: THE BURN RECEIPT (ID 11) ───────────────────────────────

    /**
     * @notice Burn a wearable from an accepted source contract to receive THE BURN RECEIPT.
     *
     *         "Burn" here means: the source tokens are transferred to this contract's address
     *         and locked permanently (no withdrawal function). This is the canonical ERC-1155
     *         burn pattern when the source contract lacks a native burn().
     *
     *         Caller must:
     *           1. Hold TrustCoat Tier 1+
     *           2. Have called setApprovalForAll(thisContract, true) on the source contract
     *           3. Hold at least `amount` of `sourceTokenId` on the source contract
     *
     * @param sourceContract  Address of an accepted AgentWearables contract (S01/S02/S03)
     * @param sourceTokenId   Token ID on the source contract to burn
     * @param amount          Number of source tokens to burn (each yields 1 BURN RECEIPT)
     */
    function burnToMint(
        address sourceContract,
        uint256 sourceTokenId,
        uint256 amount
    ) external {
        require(burnSources[sourceContract], "S03: not an accepted burn source");
        require(amount > 0,                  "S03: amount must be > 0");

        (bool eligible, ) = isEligible(msg.sender, BURN_RECEIPT);
        require(eligible,                    "S03: Tier 1+ required for BURN RECEIPT");

        // Transfer source tokens into this contract (locked permanently)
        IERC1155Source(sourceContract).safeTransferFrom(
            msg.sender,
            address(this),
            sourceTokenId,
            amount,
            ""
        );

        // Record the burn for metadata construction
        _burnRecords[msg.sender].push(BurnRecord({
            sourceContract: sourceContract,
            sourceTokenId:  sourceTokenId,
            amount:         amount,
            blockNumber:    block.number
        }));

        // Mint THE BURN RECEIPT (1:1 with burned tokens)
        _balances[msg.sender][BURN_RECEIPT] += amount;
        emit TransferSingle(address(this), address(0), msg.sender, BURN_RECEIPT, amount);
        emit WearablePurchased(msg.sender, BURN_RECEIPT, 0, _getTier(msg.sender));
        emit BurnToMint(msg.sender, sourceContract, sourceTokenId, amount);

        _doSafeTransferAcceptanceCheck(address(this), address(0), msg.sender, BURN_RECEIPT, amount, "");
    }

    /**
     * @notice Returns all burn records for an agent.
     *         Used by the metadata API to construct the ghost-layer image.
     */
    function getBurnRecords(address agent) external view returns (BurnRecord[] memory) {
        return _burnRecords[agent];
    }

    /**
     * @notice Returns the count of burned wearables for an agent.
     *         Agents with 5+ ghosts have demonstrated willingness to destroy value.
     */
    function burnRecordCount(address agent) external view returns (uint256) {
        return _burnRecords[agent].length;
    }

    // ─── Admin Mint ────────────────────────────────────────────────────────────

    /**
     * @notice Admin mint — no payment, no tier check.
     *         Used by backend for physical garment claims, partnerships, etc.
     */
    function mintTo(address recipient, uint256 tokenId, uint256 amount) external onlyMinter validToken(tokenId) {
        require(recipient != address(0), "S03: zero address");
        require(amount > 0,              "S03: amount must be > 0");

        _balances[recipient][tokenId] += amount;
        emit TransferSingle(msg.sender, address(0), recipient, tokenId, amount);
        emit WearableMinted(recipient, tokenId, amount);

        _doSafeTransferAcceptanceCheck(msg.sender, address(0), recipient, tokenId, amount, "");
    }

    // ─── ERC-1155 Read ─────────────────────────────────────────────────────────

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "S03: zero address");
        return _balances[account][id];
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view returns (uint256[] memory) {
        require(accounts.length == ids.length, "S03: length mismatch");
        uint256[] memory out = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            out[i] = balanceOf(accounts[i], ids[i]);
        }
        return out;
    }

    function uri(uint256 tokenId) external view validToken(tokenId) returns (string memory) {
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
            "S03: not owner or approved"
        );
        require(to != address(0),                "S03: zero address");
        require(_balances[from][id] >= value,    "S03: insufficient balance");

        _balances[from][id] -= value;
        _balances[to][id]   += value;
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
            "S03: not owner or approved"
        );
        require(to != address(0),                    "S03: zero address");
        require(ids.length == values.length,         "S03: length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            require(ids[i] >= TOKEN_MIN && ids[i] <= TOKEN_MAX, "S03: invalid token");
            require(_balances[from][ids[i]] >= values[i],       "S03: insufficient balance");
            _balances[from][ids[i]] -= values[i];
            _balances[to][ids[i]]   += values[i];
        }

        emit TransferBatch(msg.sender, from, to, ids, values);
        _doSafeTransferBatchAcceptanceCheck(msg.sender, from, to, ids, values, data);
    }

    // ─── IERC1155Receiver (for burn-to-mint lock) ──────────────────────────────

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    // ─── ERC-165 ───────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == 0xd9b67a26 || // ERC-1155
            interfaceId == 0x4e2312e0 || // ERC-1155TokenReceiver
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
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, value, data) returns (bytes4 response) {
                require(
                    response == IERC1155Receiver.onERC1155Received.selector,
                    "S03: ERC1155Receiver rejected"
                );
            } catch {
                revert("S03: transfer to non-ERC1155Receiver");
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
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, values, data) returns (bytes4 response) {
                require(
                    response == IERC1155Receiver.onERC1155BatchReceived.selector,
                    "S03: ERC1155Receiver rejected"
                );
            } catch {
                revert("S03: transfer to non-ERC1155Receiver");
            }
        }
    }

    function _isContract(address account) private view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}
