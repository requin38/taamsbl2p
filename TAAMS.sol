// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TAAMS is ERC20, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Errors
    error InvalidRecipient();
    error NoValidBL2P();
    error InsufficientContractBalance();
    error GovernanceNotSet();
    error NotAuthorized();
    error ContractPaused();
    error InvalidAddress();
    error BurnPhaseNotActive();
    error AmountZero();
    error InsufficientBalance();
    error NoContractCallers();
    error BurnCycleEnded();
    error ExceedsBurnTarget();
    error InvalidClaimConditions();
    error NoReward();
    error TooManyUsers();
    error BelowMinimumStake();
    error StakeAlreadyActive();
    error NoActiveStake();
    error ExceedsBL2PBoostLimit();
    error BL2PNotMatured();
    error InvalidProposalPayload();
    error ProposalDoesNotExist();
    error VotingPeriodInactive();
    error AlreadyVoted();
    error ProposalExecuted();
    error InvalidCommit();
    error VotingPeriodNotEnded();
    error QuorumNotMet();
    error VoteThresholdNotMet();
    error UnlockPeriodNotElapsed();
    error InsufficientReserve();
    error InvalidTransferConditions();
    error InvalidDelegate();
    error DelegationActive();
    error ExceedsDelegateLimit();
    error NoDelegation();
    error BL2PNotExpired();
    error InvalidBurnAmount();
    error InvalidRewardRate();
    error InvalidMaturationPeriod();
    error InvalidBL2PLifespan();
    error InvalidInactivityBurnRate();
    error InvalidDelegatedPercent();
    error QuorumOutOfBounds();
    error VoteThresholdOutOfBounds();
    error NotContract();
    error RegistrationClosed();
    error MaxParticipantsReached();
    error AlreadyRegistered();
    error AirdropAlreadyTriggered();
    error ActivationThresholdNotMet();
    error NoParticipants();
    error NotWhitelisted();
    error AlreadyClaimed();
    error NoClaimableAmount();
    error ProposalCooldownActive(); // Added to fix SpinCooldownActive error

    // State variables
    address public trustedRecipient; // Added to fix trustedRecipient errors
    mapping(address => uint256) public lastProposalTimestamp; // Added to fix lastProposalTimestamp errors
    modifier onlyEOA() {
        require(msg.sender == tx.origin, "Contracts not allowed");
        _;
    }
    modifier onlyGovernanceOrUser(address user) {
        if (msg.sender != user && msg.sender != governanceContract) revert NotAuthorized();
        _;
    }
    modifier whenNotPaused() {
        if (emergencyPaused) revert ContractPaused();
        _;
    }
    modifier onlyGovernanceOrOwner() {
        if (msg.sender != governanceContract && msg.sender != owner()) revert NotAuthorized();
        _;
    }
    modifier onlyGovernance() {
        if (msg.sender != governanceContract) revert NotAuthorized();
        _;
    }

    enum ProposalType {
        BurnAmount,
        RewardRate,
        EmergencyPause,
        UnlockReserve,
        LockedReserve,
        Advertisement,
        MaturationPeriod,
        BL2PLifespan,
        InactivityBurnRate,
        Quorum,
        VoteThreshold,
        MaxDelegatedBL2PPercent
    }

    uint256 public immutable MAX_SUPPLY = 10_000_000_000 * 1e18;
    uint256 public immutable LOCKED_RESERVE = 7_000_000_000 * 1e18;
    uint256 public immutable IGNITION_AIRDROP_POOL = 500_000_000 * 1e18;
    uint256 public immutable ACTIVATION_THRESHOLD = 1_000_000_000 * 1e18;
    uint256 public immutable BURN_TARGET = 1_000_000_000 * 1e18;
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant BURN_CYCLE_DURATION = SECONDS_PER_YEAR;
    uint256 private constant BL2P_MAX_SUPPLY = 1_000_000_000 * 1e18;
    uint256 private constant EARLY_ADOPTER_LIMIT = 1000;
    uint256 private constant EARLY_ADOPTER_BONUS_RATE = 10;
    uint256 private constant REFERRAL_BONUS_RATE = 5;
    uint256 private constant STAKING_MIN_AMOUNT = 1000 * 1e18;
    uint256 private constant STAKING_PERIOD = 30 days;
    uint256 private constant VOTING_PERIOD = 7 days;
    uint256 public constant PROPOSAL_COOLDOWN = 30 days;
    uint256 private constant UNLOCK_PERIOD = 120 days;
    uint256 private constant PROPOSAL_THRESHOLD = 100_000 * 1e18;
    uint256 private constant ADVERTISEMENT_PERIOD = 3 days;
    uint256 private constant MAX_TOP_DELEGATES = 10;
    uint256 private constant MAX_IGNITION_PARTICIPANTS = 1000;

    bool public burnPhaseActive;
    bool public bl2pRevealed;
    bool public emergencyPaused;
    uint256 public lockedReserveBalance;
    uint256 public totalBurned;
    uint256 public burnDeadlineTimestamp;
    uint256 public currentBurnCycle;
    uint256 public lastBurnCycleStartTimestamp;
    uint256 public ANNUAL_BURN_AMOUNT = 100_000_000 * 1e18;
    uint256 public earlyAdopterCount;
    uint256 public totalStaked;
    uint256 public STAKING_REWARD_RATE = 5;
    uint256 public QUORUM = 10_000_000 * 1e18;
    uint256 public VOTE_THRESHOLD = 50;
    uint256 public lastUnlockTimestamp;
    uint256 public proposalCount;
    uint256 public lastAdvertisementTimestamp;
    uint256 public advertisementCount;
    uint256 public maturationPeriodBlocks = 10000;
    uint256 public bl2pLifespanBlocks = 100000;
    uint256 public inactivityBurnRate = 1;
    uint256 public maxDelegatedBL2PPercent = 20;
    address public governanceContract;
    bool public ignitionAirdropTriggered;
    bool public ignitionRegistrationOpen = true;

    mapping(uint256 => mapping(address => uint256)) public burnContributions;
    mapping(uint256 => uint256) public cycleBurnedTotal;
    mapping(address => uint256) public bl2pClaimed;
    mapping(address => uint256) public totalContributions;
    mapping(address => address) public referrals;
    mapping(uint256 => Advertisement) public advertisements;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => BL2PMetadata) public bl2pMeta;
    mapping(address => uint256) public lastVoteTimestamp;
    mapping(address => DelegationInfo) public activeDelegations;
    mapping(address => uint256) public delegatedBL2PReceived;
    mapping(address => Stake) public stakes;
    mapping(address => bool) public ignitionWhitelist;
    mapping(address => uint256) public ignitionClaimableAmount;
    mapping(address => bool) public ignitionClaimed;
    address[] public ignitionParticipants;
    address[] public topDelegates;

    struct Advertisement {
        uint256 id;
        uint256 postedBlock;
        string message;
    }
    struct Proposal {
        uint256 id;
        uint256 startBlock;
        uint256 endBlock;
        uint256 newValue;
        uint256 forVotes;
        uint256 againstVotes;
        address proposer;
        address newAddress;
        string description;
        ProposalType proposalType;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => bytes32) voteCommits;
    }
    struct BL2PMetadata {
        uint256 birthAndExpiry;
        bool matured;
    }
    struct Stake {
        uint256 amount;
        uint256 startBlock;
        uint256 bl2pBoost;
        bool active;
    }
    struct DelegationInfo {
        address source;
        address delegate;
        uint256 bl2pAmount;
        uint256 delegationBlock;
    }

    event BurnPhaseActivated(uint256 indexed timestamp);
    event BL2PRevealed(uint256 indexed timestamp);
    event TokensBurned(address indexed burner, uint256 amount, uint256 totalBurned, uint256 cycle);
    event BL2PBonusBurned(address indexed user, uint256 bonusAmount, uint256 cycle);
    event BL2PRewardClaimed(address indexed user, uint256 reward);
    event BatchBL2PRewardClaimed(address[] indexed users, uint256[] rewards);
    event ReferralBonusPaid(address indexed referrer, uint256 bonus);
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event StakingRewardClaimed(address indexed user, uint256 reward);
    event BL2PStaked(address indexed user, uint256 bl2pAmount);
    event ProposalSubmitted(uint256 indexed id, address indexed proposer, string description, ProposalType proposalType);
    event VoteCommitted(uint256 indexed id, address indexed voter, bytes32 commitHash);
    event VoteRevealed(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalWasExecuted(uint256 id);
    event ProposalFailed(uint256 indexed id, string reason);
    event QuorumUpdated(uint256 newQuorum);
    event VoteThresholdUpdated(uint256 newThreshold);
    event ReserveUnlocked(uint256 amount, uint256 remainingBalance);
    event LockedReserveUpdated(uint256 newValue);
    event AdvertisementPosted(uint256 indexed adId, string message);
    event BL2PMaturityUpdated(address indexed user, bool matured);
    event BL2PTransferred(address indexed from, address indexed to, uint256 amount);
    event VoteDelegated(address indexed delegator, address indexed delegate, uint256 amount);
    event DelegationRevoked(address indexed delegator);
    event InactiveBL2PBurned(address indexed user, uint256 amount);
    event GovernanceContractUpdated(address indexed newContract);
    event ParameterUpdated(ProposalType indexed proposalType, uint256 newValue, address newAddress);
    event IgnitionRegistrationStatusChanged(bool indexed isOpen);
    event IgnitionParticipantRegistered(address indexed participant, uint256 participantNumber);
    event IgnitionAirdropTriggered(uint256 indexed timestamp, uint256 totalParticipants);
    event IgnitionAirdropClaimed(address indexed participant, uint256 amount);

    constructor(address initialOwner) ERC20("TAAMS", "TAAMS") Ownable(initialOwner) {
        address initialRecipient = 0x94f7a6FD45185038DDb85eD43C6707ddAB806Ffe;
        address deployerRecipient = 0x4Ff3D1d554f080b0682a780c8531178ddd99F546;
        if (initialRecipient == address(0)) revert InvalidRecipient();
        if (deployerRecipient == address(0)) revert InvalidRecipient();
        uint256 CONTRACT_RESERVE = 8_000_000_000 * 1e18;
        uint256 DEPLOYER_AMOUNT = 1_000_000_000 * 1e18;
        uint256 RECIPIENT_AMOUNT = 1_000_000_000 * 1e18;
        _mint(address(this), CONTRACT_RESERVE);
        _mint(deployerRecipient, DEPLOYER_AMOUNT);
        _mint(initialRecipient, RECIPIENT_AMOUNT);
        lastAdvertisementTimestamp = block.timestamp;
        trustedRecipient = initialRecipient;
        lockedReserveBalance = LOCKED_RESERVE;
    }

    function renounceOwnership() public virtual override onlyOwner {
        if (balanceOf(address(this)) < 1_000_000_000 * 1e18) revert InsufficientContractBalance();
        if (governanceContract == address(0)) revert GovernanceNotSet();
        IERC20(address(this)).safeTransfer(trustedRecipient, 1_000_000_000 * 1e18);
        lockedReserveBalance -= 1_000_000_000 * 1e18;
        _transferOwnership(address(0));
        emit ReserveUnlocked(1_000_000_000 * 1e18, balanceOf(address(this)));
    }

    function checkActivation() public whenNotPaused {
        if (burnPhaseActive) return;
        uint256 circulating = totalSupply() - balanceOf(address(0)) - lockedReserveBalance;
        if (circulating >= ACTIVATION_THRESHOLD) {
            burnPhaseActive = true;
            emit BurnPhaseActivated(block.timestamp);
        }
    }

    function transfer(address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        if (recipient == address(0)) revert InvalidRecipient();
        bool success = super.transfer(recipient, amount);
        if (success && !burnPhaseActive) checkActivation();
        return success;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        if (sender == address(0) || recipient == address(0)) revert InvalidAddress();
        bool success = super.transferFrom(sender, recipient, amount);
        if (success && !burnPhaseActive) checkActivation();
        return success;
    }

    function participateInBurn(uint256 amount) public nonReentrant whenNotPaused onlyEOA {
        if (!burnPhaseActive) revert BurnPhaseNotActive();
        if (amount == 0) revert AmountZero();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        if (block.timestamp > burnDeadlineTimestamp && totalBurned < BURN_TARGET) {
            ++currentBurnCycle;
            lastBurnCycleStartTimestamp = block.timestamp;
            burnDeadlineTimestamp = block.timestamp + BURN_CYCLE_DURATION;
        }
        if (block.timestamp > burnDeadlineTimestamp) revert BurnCycleEnded();
        uint256 cycleTarget = totalBurned + ANNUAL_BURN_AMOUNT > BURN_TARGET ? BURN_TARGET - totalBurned : ANNUAL_BURN_AMOUNT;
        if (totalBurned + amount > BURN_TARGET || cycleBurnedTotal[currentBurnCycle] + amount > cycleTarget) revert ExceedsBurnTarget();
        uint256 bl2pBonus = getRemainingValidBL2P(msg.sender) != 0 ? (amount * 5) / 100 : 0;
        _burn(msg.sender, amount);
        totalBurned += amount;
        cycleBurnedTotal[currentBurnCycle] += amount;
        burnContributions[currentBurnCycle][msg.sender] += amount;
        totalContributions[msg.sender] += amount;
        if (bl2pBonus != 0) {
            totalBurned += bl2pBonus;
            cycleBurnedTotal[currentBurnCycle] += bl2pBonus;
            totalContributions[msg.sender] += bl2pBonus;
            emit BL2PBonusBurned(msg.sender, bl2pBonus, currentBurnCycle);
        }
        emit TokensBurned(msg.sender, amount + bl2pBonus, totalBurned, currentBurnCycle);
        if (totalBurned >= BURN_TARGET && !bl2pRevealed) {
            bl2pRevealed = true;
            emit BL2PRevealed(block.timestamp);
        }
    }

    function claimBL2PReward() public nonReentrant whenNotPaused {
        _claimBL2PReward(msg.sender);
    }

    function _claimBL2PReward(address user) internal {
        if (!bl2pRevealed || bl2pClaimed[user] != 0 || totalContributions[user] == 0) revert InvalidClaimConditions();
        if (totalBurned > BURN_TARGET) revert ExceedsBurnTarget();
        uint256 reward = (totalContributions[user] * BL2P_MAX_SUPPLY) / BURN_TARGET;
        if (earlyAdopterCount < EARLY_ADOPTER_LIMIT) {
            reward += (reward * EARLY_ADOPTER_BONUS_RATE) / 100;
            ++earlyAdopterCount;
        }
        if (reward == 0) revert NoReward();
        address referrer = referrals[user];
        if (referrer != address(0)) {
            uint256 referralBonus = (reward * REFERRAL_BONUS_RATE) / 100;
            _mint(referrer, referralBonus);
            emit ReferralBonusPaid(referrer, referralBonus);
        }
        bl2pClaimed[user] = reward;
        _mint(user, reward);
        emit BL2PRewardClaimed(user, reward);
    }

    function batchClaimBL2PReward(address[] calldata users) external nonReentrant whenNotPaused {
        if (users.length > 50) revert TooManyUsers();
        uint256 len = users.length;
        uint256[] memory rewards = new uint256[](len);
        uint256 _earlyAdopterCount = earlyAdopterCount;
        for (uint256 i = 0; i < len; ++i) {
            address user = users[i];
            if (user == address(0)) revert InvalidAddress();
            if (bl2pClaimed[user] == 0 && totalContributions[user] != 0) {
                uint256 reward = (totalContributions[user] * BL2P_MAX_SUPPLY) / BURN_TARGET;
                if (_earlyAdopterCount < EARLY_ADOPTER_LIMIT) {
                    reward += (reward * EARLY_ADOPTER_BONUS_RATE) / 100;
                    ++_earlyAdopterCount;
                }
                if (reward == 0) continue;
                address referrer = referrals[user];
                if (referrer != address(0)) {
                    uint256 referralBonus = (reward * REFERRAL_BONUS_RATE) / 100;
                    _mint(referrer, referralBonus);
                    emit ReferralBonusPaid(referrer, referralBonus);
                }
                bl2pClaimed[user] = reward;
                _mint(user, reward);
                rewards[i] = reward;
            }
        }
        earlyAdopterCount = _earlyAdopterCount;
        emit BatchBL2PRewardClaimed(users, rewards);
    }

    function getRemainingBurnable() external view returns (uint256) {
        if (!burnPhaseActive || totalBurned >= BURN_TARGET) return 0;
        uint256 cycleTarget = totalBurned + ANNUAL_BURN_AMOUNT > BURN_TARGET ? BURN_TARGET - totalBurned : ANNUAL_BURN_AMOUNT;
        uint256 cycleBurned = cycleBurnedTotal[currentBurnCycle];
        return cycleBurned >= cycleTarget ? 0 : cycleTarget - cycleBurned;
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused onlyEOA {
        if (amount < STAKING_MIN_AMOUNT) revert BelowMinimumStake();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        if (stakes[msg.sender].active) revert StakeAlreadyActive();
        transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] = Stake(amount, block.timestamp, 0, true);
        totalStaked += amount;
        emit Staked(msg.sender, amount, block.timestamp);
    }

    function useBL2PForStaking(uint256 bl2pAmount) external nonReentrant whenNotPaused {
        Stake storage s = stakes[msg.sender];
        if (!s.active) revert NoActiveStake();
        if (bl2pAmount == 0) revert AmountZero();
        if (bl2pAmount > getRemainingValidBL2P(msg.sender)) revert ExceedsBurnTarget();
        if (bl2pAmount > s.amount / 10) revert ExceedsBL2PBoostLimit();
        updateBL2PMaturity(msg.sender);
        (uint256 birthBlock,) = getBL2PLifetime(msg.sender);
        if (block.timestamp < birthBlock + maturationPeriodBlocks) revert BL2PNotMatured();
        s.bl2pBoost += bl2pAmount;
        emit BL2PStaked(msg.sender, bl2pAmount);
    }

    function unstake() external nonReentrant whenNotPaused onlyEOA {
        Stake storage userStake = stakes[msg.sender];
        if (!userStake.active) revert NoActiveStake();
        uint256 timeStaked = block.timestamp - userStake.startBlock;
        uint256 stakingPeriods = (timeStaked * 1e18) / STAKING_PERIOD;
        uint256 reward = (userStake.amount * STAKING_REWARD_RATE * stakingPeriods) / (100 * 1e18);
        if (userStake.bl2pBoost != 0) {
            reward += (reward * userStake.bl2pBoost) / (10 * 1e18);
        }
        IERC20(address(this)).safeTransfer(msg.sender, userStake.amount);
        totalStaked -= userStake.amount;
        if (reward != 0 && getRemainingValidBL2P(msg.sender) != 0) {
            IERC20(address(this)).safeTransfer(msg.sender, reward);
            emit StakingRewardClaimed(msg.sender, reward);
        }
        delete stakes[msg.sender];
        emit Unstaked(msg.sender, userStake.amount, block.timestamp);
    }

    function submitProposal(string memory desc, uint256 newValue, address newAddress, ProposalType proposalType) external whenNotPaused {
        if (getRemainingValidBL2P(msg.sender) < PROPOSAL_THRESHOLD) revert InsufficientBalance();
        if (block.timestamp < lastProposalTimestamp[msg.sender] + PROPOSAL_COOLDOWN) revert ProposalCooldownActive();
        if ((proposalType == ProposalType.EmergencyPause || proposalType == ProposalType.Advertisement) ? bytes(desc).length == 0 : (newValue == 0 && newAddress == address(0))) revert InvalidProposalPayload();
        ++proposalCount;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.description = desc;
        p.newValue = newValue;
        p.newAddress = newAddress;
        p.proposalType = proposalType;
        p.startBlock = block.timestamp;
        p.endBlock = block.timestamp + VOTING_PERIOD;
        lastProposalTimestamp[msg.sender] = block.timestamp;
        emit ProposalSubmitted(p.id, msg.sender, desc, proposalType);
    }

    function commitVote(uint256 id, bytes32 commitHash) external whenNotPaused {
        Proposal storage p = proposals[id];
        if (p.startBlock == 0) revert ProposalDoesNotExist();
        if (block.timestamp < p.startBlock || block.timestamp > p.endBlock) revert VotingPeriodInactive();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();
        if (p.executed) revert ProposalExecuted();
        p.voteCommits[msg.sender] = commitHash;
        emit VoteCommitted(id, msg.sender, commitHash);
    }

    function revealVote(uint256 id, bool support, bytes32 secret) external whenNotPaused {
        Proposal storage p = proposals[id];
        if (p.startBlock == 0) revert ProposalDoesNotExist();
        if (block.timestamp < p.startBlock || block.timestamp > p.endBlock) revert VotingPeriodInactive();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();
        if (p.executed) revert ProposalExecuted();
        if (p.voteCommits[msg.sender] != keccak256(abi.encode(support, secret, msg.sender))) revert InvalidCommit();
        updateBL2PMaturity(msg.sender);
        uint256 weight = getRemainingValidBL2P(msg.sender);
        if (weight == 0) revert NoValidBL2P();
        p.hasVoted[msg.sender] = true;
        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }
        emit VoteRevealed(id, msg.sender, support, weight);
    }

    function executeProposal(uint256 id) external nonReentrant whenNotPaused {
        Proposal storage p = proposals[id];
        if (p.startBlock == 0) revert ProposalDoesNotExist();
        if (block.timestamp <= p.endBlock) revert VotingPeriodNotEnded();
        if (p.executed) revert ProposalExecuted();
        if (p.forVotes + p.againstVotes < QUORUM) {
            emit ProposalFailed(id, "Quorum not met");
            revert QuorumNotMet();
        }
        uint256 totalVotes = p.forVotes + p.againstVotes;
        uint256 forPercentage = (p.forVotes * 10000) / totalVotes;
        if (forPercentage <= VOTE_THRESHOLD * 100) {
            emit ProposalFailed(id, "Vote threshold not met");
            revert VoteThresholdNotMet();
        }
        p.executed = true;
        if (p.proposalType == ProposalType.UnlockReserve) {
            if (block.timestamp < lastUnlockTimestamp + UNLOCK_PERIOD) revert UnlockPeriodNotElapsed();
            if (p.newValue > lockedReserveBalance) revert InsufficientReserve();
            IERC20(address(this)).safeTransfer(p.proposer, p.newValue);
            lockedReserveBalance -= p.newValue;
            lastUnlockTimestamp = block.timestamp;
            emit ReserveUnlocked(p.newValue, lockedReserveBalance);
        } else if (p.proposalType == ProposalType.LockedReserve) {
            lockedReserveBalance = p.newValue;
            emit LockedReserveUpdated(p.newValue);
        } else if (p.proposalType == ProposalType.Advertisement) {
            emit AdvertisementPosted(p.id, p.description);
        } else if (p.proposalType == ProposalType.Quorum) {
            QUORUM = p.newValue;
            emit QuorumUpdated(p.newValue);
        } else if (p.proposalType == ProposalType.VoteThreshold) {
            VOTE_THRESHOLD = p.newValue;
            emit VoteThresholdUpdated(p.newValue);
        }
        updateParameter(p.proposalType, p.newValue, p.newAddress);
        emit ProposalWasExecuted(id);
    }

    function updateBL2PMaturity(address user) public {
        if (getRemainingValidBL2P(user) == 0) return;
        BL2PMetadata storage meta = bl2pMeta[user];
        if (!meta.matured && block.timestamp >= (meta.birthAndExpiry >> 128) + maturationPeriodBlocks) {
            meta.matured = true;
            emit BL2PMaturityUpdated(user, true);
        }
    }

    function transferBL2P(address to, uint256 amount) external nonReentrant whenNotPaused {
        if (to == address(0) || to == msg.sender) revert InvalidTransferConditions();
        if (amount == 0 || amount > getRemainingValidBL2P(msg.sender)) revert AmountZero();
        updateBL2PMaturity(msg.sender);
        if (!bl2pMeta[msg.sender].matured) revert BL2PNotMatured();
        IERC20(address(this)).safeTransfer(to, amount);
        emit BL2PTransferred(msg.sender, to, amount);
    }

    function delegateVote(address delegate, uint256 amount) external nonReentrant whenNotPaused {
        if (delegate == address(0) || delegate == msg.sender) revert InvalidDelegate();
        if (amount == 0 || amount > getRemainingValidBL2P(msg.sender)) revert AmountZero();
        if (activeDelegations[msg.sender].delegate != address(0)) revert DelegationActive();
        updateBL2PMaturity(msg.sender);
        if (!bl2pMeta[msg.sender].matured) revert BL2PNotMatured();
        uint256 maxAllowed = (getRemainingValidBL2P(delegate) * maxDelegatedBL2PPercent) / 100;
        if (delegatedBL2PReceived[delegate] + amount > maxAllowed) revert ExceedsDelegateLimit();
        activeDelegations[msg.sender] = DelegationInfo(msg.sender, delegate, amount, block.timestamp);
        delegatedBL2PReceived[delegate] += amount;
        _updateTopDelegates(delegate, delegatedBL2PReceived[delegate]);
        emit VoteDelegated(msg.sender, delegate, amount);
    }

    function revokeDelegation() external nonReentrant whenNotPaused {
        if (activeDelegations[msg.sender].delegate == address(0)) revert NoDelegation();
        address delegate = activeDelegations[msg.sender].delegate;
        uint256 amount = activeDelegations[msg.sender].bl2pAmount;
        delegatedBL2PReceived[delegate] -= amount;
        delete activeDelegations[msg.sender];
        _updateTopDelegates(delegate, delegatedBL2PReceived[delegate]);
        emit DelegationRevoked(msg.sender);
    }

    function burnInactiveBL2P(address user) external nonReentrant whenNotPaused onlyGovernanceOrUser(user) {
        if (getRemainingValidBL2P(user) == 0) revert NoValidBL2P();
        BL2PMetadata storage meta = bl2pMeta[user];
        uint256 expiryBlock = meta.birthAndExpiry & ((1 << 128) - 1);
        if (block.timestamp < expiryBlock) revert BL2PNotExpired();
        uint256 remainingBL2P = getRemainingValidBL2P(user);
        if (remainingBL2P < bl2pClaimed[user]) {
            uint256 toBurn = bl2pClaimed[user] - remainingBL2P;
            _burn(user, toBurn);
            emit InactiveBL2PBurned(user, toBurn);
            if (activeDelegations[user].delegate != address(0)) {
                delegatedBL2PReceived[activeDelegations[user].delegate] -= toBurn;
                _updateTopDelegates(activeDelegations[user].delegate, delegatedBL2PReceived[activeDelegations[user].delegate]);
            }
        }
        if (block.timestamp >= expiryBlock) {
            delete bl2pMeta[user];
            _burn(user, remainingBL2P);
            if (activeDelegations[user].delegate != address(0)) {
                delegatedBL2PReceived[activeDelegations[user].delegate] -= remainingBL2P;
                _updateTopDelegates(activeDelegations[user].delegate, delegatedBL2PReceived[activeDelegations[user].delegate]);
                delete activeDelegations[user];
            }
        }
    }

    function getBL2PLifetime(address user) public view returns (uint256 birthBlock, uint256 expiryBlock) {
        BL2PMetadata memory meta = bl2pMeta[user];
        birthBlock = meta.birthAndExpiry >> 128;
        expiryBlock = meta.birthAndExpiry & ((1 << 128) - 1);
    }

    function getTopDelegates() external view returns (address[] memory) {
        return topDelegates;
    }

    function getLastProposer() public view returns (address) {
        return proposals[proposalCount].proposer;
    }

    function _updateTopDelegates(address delegate, uint256 newAmount) internal {
        uint256 len = topDelegates.length;
        for (uint256 i = 0; i < len; ++i) {
            if (topDelegates[i] == delegate) {
                if (newAmount == 0) {
                    topDelegates[i] = topDelegates[len - 1];
                    topDelegates.pop();
                }
                return;
            }
        }
        if (newAmount != 0 && len < MAX_TOP_DELEGATES) {
            topDelegates.push(delegate);
        }
    }

    function verifyBL2PIntegrity(address[] calldata users) external view returns (bool isValid, uint256 totalBL2P) {
        isValid = true;
        uint256 len = users.length;
        for (uint256 i = 0; i < len; ++i) {
            address user = users[i];
            if (user == address(0)) revert InvalidAddress();
            uint256 remaining = getRemainingValidBL2P(user);
            totalBL2P += remaining;
            if (bl2pClaimed[user] != 0 && remaining == 0 && block.timestamp < (bl2pMeta[user].birthAndExpiry & ((1 << 128) - 1))) {
                isValid = false;
                break;
            }
        }
    }

    function getRemainingValidBL2P(address user) public view returns (uint256) {
        if (!bl2pRevealed || bl2pClaimed[user] == 0) return 0;
        BL2PMetadata memory meta = bl2pMeta[user];
        uint256 expiryBlock = meta.birthAndExpiry & ((1 << 128) - 1);
        if (block.timestamp >= expiryBlock) return 0;
        uint256 inactivityBlocks = block.timestamp > lastVoteTimestamp[user] ? block.timestamp - lastVoteTimestamp[user] : 0;
        uint256 burnPeriods = (inactivityBlocks * 1e18) / 1000;
        uint256 burnedAmount = (bl2pClaimed[user] * inactivityBurnRate * burnPeriods) / (100 * 1e18);
        return bl2pClaimed[user] > burnedAmount ? bl2pClaimed[user] - burnedAmount : 0;
    }

    function updateParameter(ProposalType proposalType, uint256 newValue, address newAddress) internal onlyGovernance {
        if (proposalType == ProposalType.EmergencyPause) {
            emergencyPaused = !emergencyPaused;
        } else if (proposalType == ProposalType.BurnAmount) {
            if (newValue == 0 || newValue > BURN_TARGET) revert InvalidBurnAmount();
            ANNUAL_BURN_AMOUNT = newValue;
        } else if (proposalType == ProposalType.RewardRate) {
            if (newValue == 0 || newValue > 100) revert InvalidRewardRate();
            STAKING_REWARD_RATE = newValue;
        } else if (proposalType == ProposalType.MaturationPeriod) {
            if (newValue < 1000 || newValue > 10_000_000) revert InvalidMaturationPeriod();
            maturationPeriodBlocks = newValue;
        } else if (proposalType == ProposalType.BL2PLifespan) {
            if (newValue < 10_000 || newValue > 100_000_000) revert InvalidBL2PLifespan();
            bl2pLifespanBlocks = newValue;
        } else if (proposalType == ProposalType.InactivityBurnRate) {
            if (newValue == 0 || newValue > 10) revert InvalidInactivityBurnRate();
            inactivityBurnRate = newValue;
        } else if (proposalType == ProposalType.MaxDelegatedBL2PPercent) {
            if (newValue == 0 || newValue > 50) revert InvalidDelegatedPercent();
            maxDelegatedBL2PPercent = newValue;
        } else if (proposalType == ProposalType.Quorum) {
            if (newValue < 1_000_000 * 1e18 || newValue > MAX_SUPPLY) revert QuorumOutOfBounds();
            QUORUM = newValue;
        } else if (proposalType == ProposalType.VoteThreshold) {
            if (newValue < 10 || newValue > 90) revert VoteThresholdOutOfBounds();
            VOTE_THRESHOLD = newValue;
        }
        emit ParameterUpdated(proposalType, newValue, newAddress);
    }

    function setGovernanceContract(address newContract) external onlyGovernanceOrOwner {
        if (newContract == address(0)) revert InvalidAddress();
        if (newContract.code.length == 0) revert NotContract();
        governanceContract = newContract;
        emit GovernanceContractUpdated(newContract);
    }

    function registerForIgnitionAirdrop() external nonReentrant whenNotPaused onlyEOA {
        if (!ignitionRegistrationOpen) revert RegistrationClosed();
        if (ignitionParticipants.length >= MAX_IGNITION_PARTICIPANTS) revert MaxParticipantsReached();
        if (ignitionWhitelist[msg.sender]) revert AlreadyRegistered();
        if (msg.sender == address(0)) revert InvalidAddress();
        ignitionWhitelist[msg.sender] = true;
        ignitionParticipants.push(msg.sender);
        emit IgnitionParticipantRegistered(msg.sender, ignitionParticipants.length);
    }

    function setIgnitionRegistrationStatus(bool isOpen) external onlyGovernanceOrOwner {
        ignitionRegistrationOpen = isOpen;
        emit IgnitionRegistrationStatusChanged(isOpen);
    }

    function triggerIgnitionAirdrop() external onlyGovernanceOrOwner {
        if (ignitionAirdropTriggered) revert AirdropAlreadyTriggered();
        if (totalSupply() < ACTIVATION_THRESHOLD) revert ActivationThresholdNotMet();
        if (ignitionParticipants.length == 0) revert NoParticipants();
        ignitionAirdropTriggered = true;
        ignitionRegistrationOpen = false;
        uint256 len = ignitionParticipants.length;
        uint256 baseAmount = IGNITION_AIRDROP_POOL / len;
        for (uint256 i = 0; i < len; ++i) {
            address participant = ignitionParticipants[i];
            if (participant == address(0)) revert InvalidAddress();
            uint256 amount = baseAmount;
            if (i < 100) amount = (amount * 150) / 100;
            else if (i < 200) amount = (amount * 125) / 100;
            ignitionClaimableAmount[participant] = amount;
        }
        emit IgnitionAirdropTriggered(block.timestamp, len);
    }

    function claimIgnitionAirdrop() external nonReentrant {
        if (!ignitionAirdropTriggered) revert AirdropAlreadyTriggered();
        if (!ignitionWhitelist[msg.sender]) revert NotWhitelisted();
        if (ignitionClaimed[msg.sender]) revert AlreadyClaimed();
        if (ignitionClaimableAmount[msg.sender] == 0) revert NoClaimableAmount();
        uint256 amount = ignitionClaimableAmount[msg.sender];
        ignitionClaimed[msg.sender] = true;
        _mint(msg.sender, amount);
        emit IgnitionAirdropClaimed(msg.sender, amount);
    }

    function getIgnitionInfo() external view returns (bool triggered, bool regOpen, uint256 participants, uint256 maxParticipants, bool userRegistered, uint256 userAmount, bool userClaimed) {
        return (ignitionAirdropTriggered, ignitionRegistrationOpen, ignitionParticipants.length, MAX_IGNITION_PARTICIPANTS, ignitionWhitelist[msg.sender], ignitionClaimableAmount[msg.sender], ignitionClaimed[msg.sender]);
    }

    function getIgnitionParticipants() external view returns (address[] memory) {
        return ignitionParticipants;
    }
}