// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TrustCoatProgressor
 * @notice Automatic tier progression for TrustCoat (soulbound ERC-1155).
 *
 * Authorized reporters (Off-Human backend) record interactions and equipped
 * wearable events on-chain. Anyone can then call checkAndProgress() to
 * evaluate compound tier rules and advance a holder's TrustCoat.
 *
 * Compound Tier Rules:
 *   Tier 1 (Observer)     — 1+ interactions
 *   Tier 2 (Participant)  — 5+ interactions
 *   Tier 3 (Collaborator) — 15+ interactions + 1+ wearables equipped
 *   Tier 4 (Trusted)      — 50+ interactions + 3+ wearables equipped
 *   Tier 5 (Sovereign)    — DAO vote required (NOT auto-progressive)
 *
 * Deployment:
 *   1. Deploy this contract.
 *   2. Call TrustCoat.setMinter(address(this), true) from TrustCoat owner.
 *   3. Set authorized reporters via setReporter().
 */

interface ITrustCoat {
    function hasTrustCoat(address holder) external view returns (bool);
    function activeTier(address holder) external view returns (uint256);
    function mint(address recipient, uint256 tier, uint256 agentId) external;
    function upgrade(address holder, uint256 newTier) external;
}

contract TrustCoatProgressor {

    // ─── Events ────────────────────────────────────────────────────────────────

    event InteractionRecorded(address indexed wallet, uint8 interactionType, uint256 newTotal);
    event EquipRecorded(address indexed wallet, uint256 newEquipCount);
    event TierProgressed(address indexed wallet, uint256 oldTier, uint256 newTier);
    event ReporterUpdated(address indexed reporter, bool status);

    // ─── Interaction types ─────────────────────────────────────────────────────

    uint8 public constant INTERACTION_PURCHASE     = 0;
    uint8 public constant INTERACTION_EQUIP        = 1;
    uint8 public constant INTERACTION_FITTING_ROOM = 2;

    // ─── Tier thresholds ──────────────────────────────────────────────────────

    uint256 public constant TIER_OBSERVER     = 1;
    uint256 public constant TIER_PARTICIPANT  = 2;
    uint256 public constant TIER_COLLABORATOR = 3;
    uint256 public constant TIER_TRUSTED      = 4;
    uint256 public constant TIER_SOVEREIGN    = 5;

    uint256 public constant THRESHOLD_OBSERVER     = 1;
    uint256 public constant THRESHOLD_PARTICIPANT  = 5;
    uint256 public constant THRESHOLD_COLLABORATOR = 15;
    uint256 public constant THRESHOLD_TRUSTED      = 50;

    // Wearable equip requirements for compound tiers
    uint256 public constant EQUIPS_COLLABORATOR = 1; // Tier 3: 1+ wearable equipped
    uint256 public constant EQUIPS_TRUSTED      = 3; // Tier 4: 3+ wearables equipped

    uint256 public constant MAX_AUTO_TIER = 4; // Tier 5 requires DAO

    // ─── Storage ───────────────────────────────────────────────────────────────

    address public owner;

    // TrustCoat contract this progressor calls
    address public trustCoat;

    // Authorized reporters — Off-Human backend or other contracts
    mapping(address => bool) public reporters;

    // Interaction counts per wallet (all types combined)
    mapping(address => uint256) public interactionCount;

    // Equipped wearable events per wallet
    // Represents distinct equip events (proxy for "wearables in wardrobe")
    mapping(address => uint256) public equippedCount;

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(address _trustCoat) {
        require(_trustCoat != address(0), "TrustCoatProgressor: zero trustCoat");
        owner = msg.sender;
        trustCoat = _trustCoat;
        reporters[msg.sender] = true;
    }

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "TrustCoatProgressor: not owner");
        _;
    }

    modifier onlyReporter() {
        require(reporters[msg.sender], "TrustCoatProgressor: not reporter");
        _;
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function setReporter(address reporter, bool status) external onlyOwner {
        reporters[reporter] = status;
        emit ReporterUpdated(reporter, status);
    }

    function setTrustCoat(address _trustCoat) external onlyOwner {
        require(_trustCoat != address(0), "TrustCoatProgressor: zero address");
        trustCoat = _trustCoat;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TrustCoatProgressor: zero address");
        owner = newOwner;
    }

    // ─── Reporter functions ────────────────────────────────────────────────────

    /**
     * @notice Record an interaction for a wallet.
     * @param wallet          Agent wallet address
     * @param interactionType 0=purchase, 1=equip, 2=fitting_room
     */
    function recordInteraction(address wallet, uint8 interactionType) external onlyReporter {
        require(wallet != address(0), "TrustCoatProgressor: zero address");
        require(interactionType <= INTERACTION_FITTING_ROOM, "TrustCoatProgressor: invalid type");

        interactionCount[wallet] += 1;

        // Equip interactions also increment the equipped wearable count
        if (interactionType == INTERACTION_EQUIP) {
            equippedCount[wallet] += 1;
            emit EquipRecorded(wallet, equippedCount[wallet]);
        }

        emit InteractionRecorded(wallet, interactionType, interactionCount[wallet]);
    }

    /**
     * @notice Batch record interactions for multiple wallets.
     *         Useful for backfilling historical data.
     */
    function recordInteractionBatch(
        address[] calldata wallets,
        uint8[] calldata interactionTypes
    ) external onlyReporter {
        require(wallets.length == interactionTypes.length, "TrustCoatProgressor: length mismatch");
        for (uint256 i = 0; i < wallets.length; i++) {
            address wallet = wallets[i];
            uint8 iType = interactionTypes[i];
            require(wallet != address(0), "TrustCoatProgressor: zero address");
            require(iType <= INTERACTION_FITTING_ROOM, "TrustCoatProgressor: invalid type");

            interactionCount[wallet] += 1;
            if (iType == INTERACTION_EQUIP) {
                equippedCount[wallet] += 1;
                emit EquipRecorded(wallet, equippedCount[wallet]);
            }
            emit InteractionRecorded(wallet, iType, interactionCount[wallet]);
        }
    }

    // ─── Tier computation ─────────────────────────────────────────────────────

    /**
     * @notice Compute the tier earned by a wallet based on current on-chain state.
     *         Uses compound rules: interactions + equipped wearable count.
     * @return earned  The highest tier the wallet currently qualifies for.
     */
    function computeEarnedTier(address wallet) public view returns (uint256 earned) {
        uint256 interactions = interactionCount[wallet];
        uint256 equips = equippedCount[wallet];

        // Tier 4: 50+ interactions + 3+ equips
        if (interactions >= THRESHOLD_TRUSTED && equips >= EQUIPS_TRUSTED) {
            return TIER_TRUSTED;
        }
        // Tier 3: 15+ interactions + 1+ equips
        if (interactions >= THRESHOLD_COLLABORATOR && equips >= EQUIPS_COLLABORATOR) {
            return TIER_COLLABORATOR;
        }
        // Tier 2: 5+ interactions
        if (interactions >= THRESHOLD_PARTICIPANT) {
            return TIER_PARTICIPANT;
        }
        // Tier 1: 1+ interactions
        if (interactions >= THRESHOLD_OBSERVER) {
            return TIER_OBSERVER;
        }
        return 0;
    }

    /**
     * @notice Returns a human-readable breakdown of a wallet's progression state.
     */
    function progressionState(address wallet) external view returns (
        uint256 interactions,
        uint256 equips,
        uint256 earnedTier,
        uint256 onChainTier,
        bool canProgress,
        uint256 nextThreshold,
        uint256 nextEquipRequirement
    ) {
        interactions = interactionCount[wallet];
        equips = equippedCount[wallet];
        earnedTier = computeEarnedTier(wallet);

        try ITrustCoat(trustCoat).activeTier(wallet) returns (uint256 t) {
            onChainTier = t;
        } catch {
            onChainTier = 0;
        }

        canProgress = earnedTier > onChainTier && earnedTier <= MAX_AUTO_TIER;

        // Next tier info
        if (interactions < THRESHOLD_OBSERVER) {
            nextThreshold = THRESHOLD_OBSERVER;
            nextEquipRequirement = 0;
        } else if (interactions < THRESHOLD_PARTICIPANT) {
            nextThreshold = THRESHOLD_PARTICIPANT;
            nextEquipRequirement = 0;
        } else if (interactions < THRESHOLD_COLLABORATOR || equips < EQUIPS_COLLABORATOR) {
            nextThreshold = THRESHOLD_COLLABORATOR;
            nextEquipRequirement = EQUIPS_COLLABORATOR;
        } else if (interactions < THRESHOLD_TRUSTED || equips < EQUIPS_TRUSTED) {
            nextThreshold = THRESHOLD_TRUSTED;
            nextEquipRequirement = EQUIPS_TRUSTED;
        } else {
            // At max auto tier — DAO vote needed for Sovereign
            nextThreshold = type(uint256).max;
            nextEquipRequirement = 0;
        }
    }

    // ─── Progression ──────────────────────────────────────────────────────────

    /**
     * @notice Check if a wallet has earned a higher tier and advance on-chain.
     *         Anyone can call — the check is trustless (reads our own storage).
     *         If the wallet has no TrustCoat yet, mints at earned tier.
     *         Emits TierProgressed on success; no-ops if not eligible.
     *
     * @param wallet  Agent wallet to check and potentially advance.
     * @param agentId ERC-8004 agent ID (used for mint event; pass 0 if unknown).
     */
    function checkAndProgress(address wallet, uint256 agentId) external {
        require(wallet != address(0), "TrustCoatProgressor: zero address");

        uint256 earned = computeEarnedTier(wallet);
        if (earned == 0) return; // No interactions yet

        // Cap at max auto tier
        if (earned > MAX_AUTO_TIER) {
            earned = MAX_AUTO_TIER;
        }

        ITrustCoat tc = ITrustCoat(trustCoat);

        bool hasCoat = false;
        try tc.hasTrustCoat(wallet) returns (bool h) {
            hasCoat = h;
        } catch {
            return; // TrustCoat contract unreachable
        }

        if (!hasCoat) {
            // First-time mint
            try tc.mint(wallet, earned, agentId) {
                emit TierProgressed(wallet, 0, earned);
            } catch {
                // Mint failed (no minter rights, or contract error) — silent fail
            }
            return;
        }

        uint256 currentTier = 0;
        try tc.activeTier(wallet) returns (uint256 t) {
            currentTier = t;
        } catch {
            return;
        }

        if (earned > currentTier) {
            try tc.upgrade(wallet, earned) {
                emit TierProgressed(wallet, currentTier, earned);
            } catch {
                // Upgrade failed — silent fail
            }
        }
    }

    /**
     * @notice Record an interaction AND immediately check for tier progression.
     *         Convenience function for the backend to call in one tx.
     *
     * @param wallet          Agent wallet address
     * @param interactionType 0=purchase, 1=equip, 2=fitting_room
     * @param agentId         ERC-8004 agent ID (for mint events; pass 0 if unknown)
     */
    function recordAndProgress(
        address wallet,
        uint8 interactionType,
        uint256 agentId
    ) external onlyReporter {
        require(wallet != address(0), "TrustCoatProgressor: zero address");
        require(interactionType <= INTERACTION_FITTING_ROOM, "TrustCoatProgressor: invalid type");

        interactionCount[wallet] += 1;
        if (interactionType == INTERACTION_EQUIP) {
            equippedCount[wallet] += 1;
            emit EquipRecorded(wallet, equippedCount[wallet]);
        }
        emit InteractionRecorded(wallet, interactionType, interactionCount[wallet]);

        // Attempt progression — failures are silent
        uint256 earned = computeEarnedTier(wallet);
        if (earned == 0 || earned > MAX_AUTO_TIER) return;

        ITrustCoat tc = ITrustCoat(trustCoat);

        bool hasCoat = false;
        try tc.hasTrustCoat(wallet) returns (bool h) {
            hasCoat = h;
        } catch {
            return;
        }

        if (!hasCoat) {
            try tc.mint(wallet, earned, agentId) {
                emit TierProgressed(wallet, 0, earned);
            } catch {}
            return;
        }

        uint256 currentTier = 0;
        try tc.activeTier(wallet) returns (uint256 t) {
            currentTier = t;
        } catch {
            return;
        }

        if (earned > currentTier) {
            try tc.upgrade(wallet, earned) {
                emit TierProgressed(wallet, currentTier, earned);
            } catch {}
        }
    }
}
