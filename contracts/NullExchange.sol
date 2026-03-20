// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title NullExchange
 * @notice Season 03: LEDGER — THE NULL EXCHANGE
 *
 * You pay 5 USDC for nothing. The receipt IS the garment.
 *
 * Token ID 1: NULL EXCHANGE RECEIPT
 *   — ERC-1155, non-soulbound (transferable)
 *   — Minted on purchase at 5 USDC
 *   — No tier gating — open to all
 *   — NFT metadata encodes the purchase tx hash as provenance
 *
 * USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
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

contract NullExchange is IERC165 {

    // ─── Events ────────────────────────────────────────────────────────────────

    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    // Emitted on every purchase — encodes the exchange on-chain
    event ExchangeRecorded(
        address indexed buyer,
        uint256 indexed receiptId,
        uint256 usdcPaid,
        uint256 timestamp
    );

    event TreasuryUpdated(address indexed treasury);

    // ─── Constants ─────────────────────────────────────────────────────────────

    uint256 public constant RECEIPT_TOKEN_ID = 1;
    uint256 public constant PRICE_USDC = 5_000_000; // 5.00 USDC (6 decimals)

    // ─── Storage ───────────────────────────────────────────────────────────────

    address public owner;
    address public treasury;
    address public usdc;

    // ERC-1155 balances
    mapping(address => mapping(uint256 => uint256)) private _balances;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Receipt counter — monotonically increasing receipt IDs
    uint256 public totalReceipts;

    // Metadata URI for the receipt NFT
    string private _uri;

    // ─── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _usdc      USDC token contract on Base
     * @param _treasury  Wallet that receives USDC proceeds
     * @param _metaUri   Metadata URI (e.g. https://off-human.vercel.app/api/null-exchange/metadata/1)
     */
    constructor(address _usdc, address _treasury, string memory _metaUri) {
        require(_usdc != address(0), "NullExchange: zero usdc");
        require(_treasury != address(0), "NullExchange: zero treasury");

        owner = msg.sender;
        usdc = _usdc;
        treasury = _treasury;
        _uri = _metaUri;
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "NullExchange: not owner");
        _;
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "NullExchange: zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setURI(string calldata newUri) external onlyOwner {
        _uri = newUri;
        emit URI(newUri, RECEIPT_TOKEN_ID);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "NullExchange: zero address");
        owner = newOwner;
    }

    // ─── Purchase ──────────────────────────────────────────────────────────────

    /**
     * @notice Purchase THE NULL EXCHANGE.
     *         You pay 5 USDC. You receive this record of paying 5 USDC.
     *         No object is shipped. The receipt is the garment.
     *
     *         Caller must approve this contract to spend 5 USDC before calling.
     *
     * @param amount  Number of receipts to mint (usually 1)
     */
    function purchase(uint256 amount) external {
        require(amount > 0, "NullExchange: amount must be > 0");

        uint256 totalCost = PRICE_USDC * amount;

        // Collect USDC
        bool ok = IERC20(usdc).transferFrom(msg.sender, treasury, totalCost);
        require(ok, "NullExchange: USDC transfer failed");

        // Mint receipt tokens
        _balances[msg.sender][RECEIPT_TOKEN_ID] += amount;
        totalReceipts += amount;

        emit TransferSingle(address(this), address(0), msg.sender, RECEIPT_TOKEN_ID, amount);
        emit ExchangeRecorded(msg.sender, totalReceipts, totalCost, block.timestamp);

        _doSafeTransferAcceptanceCheck(
            address(this), address(0), msg.sender, RECEIPT_TOKEN_ID, amount, ""
        );
    }

    // ─── ERC-1155 Read ─────────────────────────────────────────────────────────

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "NullExchange: zero address");
        return _balances[account][id];
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view returns (uint256[] memory) {
        require(accounts.length == ids.length, "NullExchange: length mismatch");
        uint256[] memory out = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            out[i] = balanceOf(accounts[i], ids[i]);
        }
        return out;
    }

    function uri(uint256) external view returns (string memory) {
        return _uri;
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
    ) external {
        require(
            from == msg.sender || _operatorApprovals[from][msg.sender],
            "NullExchange: not owner or approved"
        );
        require(to != address(0), "NullExchange: zero address");
        require(_balances[from][id] >= value, "NullExchange: insufficient balance");

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
            "NullExchange: not owner or approved"
        );
        require(to != address(0), "NullExchange: zero address");
        require(ids.length == values.length, "NullExchange: length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            require(_balances[from][ids[i]] >= values[i], "NullExchange: insufficient balance");
            _balances[from][ids[i]] -= values[i];
            _balances[to][ids[i]] += values[i];
        }

        emit TransferSingle(msg.sender, from, to, ids[0], values[0]);
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
                    "NullExchange: ERC1155Receiver rejected"
                );
            } catch {
                revert("NullExchange: transfer to non-ERC1155Receiver");
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
                    "NullExchange: ERC1155Receiver rejected"
                );
            } catch {
                revert("NullExchange: transfer to non-ERC1155Receiver");
            }
        }
    }

    function _isContract(address account) private view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}
