// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title OffHumanSliceHook
 * @notice Slice product hook for Off-Human wearables commerce.
 *
 * Implements ISliceProductHook — called by SliceCore on every purchase.
 * On purchase:
 *   1. Records buyer + product in purchase history
 *   2. Notifies TrustCoat registry to advance buyer trust tier
 *   3. Emits WearablePurchased for off-chain order fulfillment
 *
 * Slice Hooks spec: https://docs.slice.so/hooks
 * SliceCore (Base): 0x21da1b084175f95285B49b22C018889c45E1820d
 *
 * Hackathon tracks:
 *   - Future of Commerce ($750): decentralized crypto checkout via Slice
 *   - Slice Hooks ($550): custom hook logic on wearable purchase
 */

interface ISliceProductHook {
    function onProductPurchase(
        uint256 slicerId,
        uint32 productId,
        address buyer,
        uint256 quantity,
        bytes memory slicerCustomData,
        bytes memory buyerCustomData
    ) external payable;
}

interface ITrustCoat {
    function recordPurchase(address buyer) external;
    function getTier(address buyer) external view returns (uint8);
}

contract OffHumanSliceHook is ISliceProductHook {
    // ─── State ───────────────────────────────────────────────────────────────

    address public owner;
    address public trustCoat;          // TrustCoat.sol (set after deployment)
    address public sliceCore;          // SliceCore on Base

    // buyer → total purchases through Slice
    mapping(address => uint256) public purchaseCount;

    // slicerId + productId → Off-Human product SKU (e.g. "01_GHOST_TEE")
    mapping(uint256 => mapping(uint32 => string)) public productSku;

    // ─── Events ───────────────────────────────────────────────────────────────

    event WearablePurchased(
        address indexed buyer,
        uint256 indexed slicerId,
        uint32 indexed productId,
        uint256 quantity,
        string sku,
        uint256 totalPurchases
    );

    event TrustTierAdvanced(address indexed buyer, uint8 newTier);
    event ProductSkuSet(uint256 slicerId, uint32 productId, string sku);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error OnlyOwner();
    error OnlySliceCore();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _sliceCore) {
        owner = msg.sender;
        sliceCore = _sliceCore;
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlySliceCore() {
        if (msg.sender != sliceCore) revert OnlySliceCore();
        _;
    }

    // ─── Hook ─────────────────────────────────────────────────────────────────

    /**
     * @notice Called by SliceCore when a buyer completes a product purchase.
     * @param slicerId  Off-Human's slicer ID on Slice protocol
     * @param productId Product ID within the slicer
     * @param buyer     Purchasing wallet address
     * @param quantity  Number of units purchased
     */
    function onProductPurchase(
        uint256 slicerId,
        uint32 productId,
        address buyer,
        uint256 quantity,
        bytes memory,   // slicerCustomData — unused
        bytes memory    // buyerCustomData — unused
    ) external payable onlySliceCore {
        purchaseCount[buyer] += quantity;
        string memory sku = productSku[slicerId][productId];

        emit WearablePurchased(
            buyer,
            slicerId,
            productId,
            quantity,
            sku,
            purchaseCount[buyer]
        );

        // Advance TrustCoat tier if contract is wired
        if (trustCoat != address(0)) {
            ITrustCoat tc = ITrustCoat(trustCoat);
            uint8 tierBefore = tc.getTier(buyer);
            tc.recordPurchase(buyer);
            uint8 tierAfter = tc.getTier(buyer);
            if (tierAfter > tierBefore) {
                emit TrustTierAdvanced(buyer, tierAfter);
            }
        }
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * @notice Wire TrustCoat after its deployment. Can be called once TrustCoat
     *         is deployed to Base Sepolia / mainnet.
     */
    function setTrustCoat(address _trustCoat) external onlyOwner {
        trustCoat = _trustCoat;
    }

    /**
     * @notice Map a Slice product to an Off-Human SKU for fulfillment.
     * @param _slicerId  Slice slicer ID
     * @param _productId Slice product ID
     * @param _sku       Off-Human product SKU (matches products.json)
     */
    function setProductSku(
        uint256 _slicerId,
        uint32 _productId,
        string calldata _sku
    ) external onlyOwner {
        productSku[_slicerId][_productId] = _sku;
        emit ProductSkuSet(_slicerId, _productId, _sku);
    }

    /**
     * @notice Transfer ownership.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    /**
     * @notice Withdraw any ETH forwarded by SliceCore (e.g. native currency).
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
