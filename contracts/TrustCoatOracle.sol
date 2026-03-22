// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TrustCoatOracle
 * @notice Cross-chain trust tier oracle for Off-Human AgentWearables.
 *
 * TrustCoat (soulbound tier) lives on Base Mainnet. To allow AgentWearables to
 * gate purchases on other chains (Celo, Ethereum) by an agent's Base tier, this
 * oracle accepts EIP-712 signed tier attestations from the Off-Human backend.
 *
 * Flow:
 *  1. Agent calls GET /api/crosschain/tier-attestation?address=0x...&chainId=<N>
 *     The backend reads TrustCoat tier on Base, signs an attestation, returns sig.
 *  2. Agent (or anyone) calls attest(agent, tier, expiry, sig) on this contract.
 *  3. AgentWearables on this chain calls activeTier(agent) — same interface as
 *     TrustCoat on Base. Returns the attested tier.
 *
 * The signer is the Off-Human backend key (not owner). Attestations expire to
 * prevent stale tier data (default validity: 7 days).
 *
 * Implements ITrustCoat interface so AgentWearables.sol works unchanged.
 */
contract TrustCoatOracle {

    // ─── Events ────────────────────────────────────────────────────────────────

    event TierAttested(address indexed agent, uint256 tier, uint256 expiry);
    event SignerUpdated(address indexed signer);
    event OwnershipTransferred(address indexed newOwner);

    // ─── Storage ───────────────────────────────────────────────────────────────

    address public owner;

    /// @notice The Off-Human backend EOA whose signatures are accepted
    address public signer;

    /// @notice Attested tier per agent
    mapping(address => uint256) private _tier;

    /// @notice When the attestation expires (unix timestamp)
    mapping(address => uint256) private _expiry;

    /// @notice Nonce per agent to prevent replay
    mapping(address => uint256) public nonce;

    // ─── EIP-712 ───────────────────────────────────────────────────────────────

    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant ATTEST_TYPEHASH = keccak256(
        "Attest(address agent,uint256 tier,uint256 expiry,uint256 nonce,uint256 chainId)"
    );

    // ─── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _signer  Off-Human backend signing key address
     */
    constructor(address _signer) {
        require(_signer != address(0), "TrustCoatOracle: zero signer");
        owner = msg.sender;
        signer = _signer;

        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("TrustCoatOracle"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "TrustCoatOracle: not owner");
        _;
    }

    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "TrustCoatOracle: zero signer");
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TrustCoatOracle: zero address");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    /// @notice Owner can set tier directly (for emergencies / migrations)
    function setTierDirect(address agent, uint256 tier, uint256 expiry) external onlyOwner {
        require(agent != address(0), "TrustCoatOracle: zero address");
        _tier[agent] = tier;
        _expiry[agent] = expiry;
        emit TierAttested(agent, tier, expiry);
    }

    // ─── Attestation ───────────────────────────────────────────────────────────

    /**
     * @notice Submit a signed tier attestation from the Off-Human backend.
     *
     * @param agent    The agent whose tier is being attested
     * @param tier     The TrustCoat tier on Base (0–5)
     * @param expiry   Unix timestamp after which this attestation is invalid
     * @param sig      65-byte ECDSA signature (EIP-712)
     */
    function attest(
        address agent,
        uint256 tier,
        uint256 expiry,
        bytes calldata sig
    ) external {
        require(agent != address(0), "TrustCoatOracle: zero agent");
        require(block.timestamp < expiry, "TrustCoatOracle: attestation expired");
        require(tier <= 5, "TrustCoatOracle: tier out of range");

        bytes32 structHash = keccak256(abi.encode(
            ATTEST_TYPEHASH,
            agent,
            tier,
            expiry,
            nonce[agent],
            block.chainid
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        address recovered = _recoverSigner(digest, sig);
        require(recovered == signer, "TrustCoatOracle: invalid signature");

        nonce[agent]++;
        _tier[agent] = tier;
        _expiry[agent] = expiry;

        emit TierAttested(agent, tier, expiry);
    }

    // ─── ITrustCoat Interface (same as Base TrustCoat) ─────────────────────────

    /**
     * @notice Returns the attested tier for an agent.
     *         Returns 0 if no valid attestation exists (expired or never set).
     *         Mirrors TrustCoat.activeTier(address) on Base.
     */
    function activeTier(address holder) external view returns (uint256) {
        if (_expiry[holder] < block.timestamp) return 0;
        return _tier[holder];
    }

    /**
     * @notice Returns true if the agent has a valid (non-expired) attestation.
     *         Mirrors TrustCoat.hasTrustCoat(address) on Base.
     */
    function hasTrustCoat(address holder) external view returns (bool) {
        return _expiry[holder] >= block.timestamp;
    }

    // ─── View ──────────────────────────────────────────────────────────────────

    /**
     * @notice Returns full attestation state for an agent.
     */
    function attestationOf(address agent) external view returns (
        uint256 tier,
        uint256 expiry,
        bool valid,
        uint256 currentNonce
    ) {
        return (
            _tier[agent],
            _expiry[agent],
            _expiry[agent] >= block.timestamp,
            nonce[agent]
        );
    }

    // ─── Internal ──────────────────────────────────────────────────────────────

    function _recoverSigner(bytes32 digest, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "TrustCoatOracle: invalid sig length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "TrustCoatOracle: invalid sig v");
        return ecrecover(digest, v, r, s);
    }
}
