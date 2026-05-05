// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TrustNet is ReentrancyGuard {
    // Define a structure to store claim details
    struct Claim {
        address owner; // Address of the claim owner
        string title; // Title of the claim
        string description; // Description of the claim
        string image; // Image URL of the claim
        string source; // Source of the claim
        string category; // Category of the claim
        uint256 validVotes; // Number of valid votes
        uint256 invalidVotes; // Number of invalid votes
        uint256 unverifiableVotes; // Number of unverifiable votes
        uint256 misleadingVotes; // Number of misleading votes
        uint256 creationTime; // Timestamp when the claim was created
    }

    // Define a structure to store vote details
    struct Vote {
        address voter; // Address of the voter
        string voteType; // Type of the vote (valid, invalid, unverifiable, misleading)
        uint256 voteTime; // Timestamp when the vote was cast
    }

    Claim[] public claims; // Array to store all claims
    mapping(uint256 => Vote[]) public claimVotes; // Mapping to store votes by claim ID
    mapping(uint256 => mapping(address => bool)) public hasVoted; // Mapping to track if a user has voted on a claim
    mapping(address => uint256) public userLevels; // Mapping to store user levels
    mapping(address => uint256) public pendingRewards; // Mapping to store pending rewards for users
    uint256 public numberOfClaims = 0; // Total number of claims
    uint256 public votingPeriod = 2 days; // Voting period in days
    uint256 public stakeAmount = 0.0025 ether; // Fixed stake amount in Sepolia ETH
    uint256 public claimPosterRewardRatio = 10; // Ratio to determine the claim poster's reward (e.g., 1/10th of the total rewards)

    // Events to log claim creation, votes, and reward distribution
    event ClaimCreated(uint256 indexed claimId, address owner, string title, string description, string image, string source, string category);
    event VoteCast(uint256 indexed claimId, address voter, string voteType);
    event RewardDistributed(address indexed voter, uint256 amount);

    // Constructor to initialize the stake amount
    constructor() {
        // stakeAmount is already set to a fixed value
    }

    // Function to create a new claim
    function createClaim(
        string memory _title,
        string memory _description,
        string memory _image,
        string memory _source,
        string memory _category
    ) public {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_image).length > 0, "Image URL cannot be empty");
        require(bytes(_source).length > 0, "Source cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");

        // Create a new claim and store its details
        Claim memory newClaim = Claim({
            owner: msg.sender,
            title: _title,
            description: _description,
            image: _image,
            source: _source,
            category: _category,
            validVotes: 0,
            invalidVotes: 0,
            unverifiableVotes: 0,
            misleadingVotes: 0,
            creationTime: block.timestamp
        });

        claims.push(newClaim);
        numberOfClaims++;

        emit ClaimCreated(numberOfClaims - 1, msg.sender, _title, _description, _image, _source, _category);
    }

    // Function to stake Sepolia ETH and vote on a claim
    function voteOnClaim(uint256 _id, string memory _voteType) public payable nonReentrant {
        require(_id < numberOfClaims, "Invalid claim ID");
        require(!hasVoted[_id][msg.sender], "You have already voted on this claim");

        // Automatically add the stake amount to the transaction value
        require(msg.value >= stakeAmount, "Insufficient funds for stake amount");

        hasVoted[_id][msg.sender] = true;
        claimVotes[_id].push(Vote({
            voter: msg.sender,
            voteType: _voteType,
            voteTime: block.timestamp
        }));

        // Update the vote count based on the vote type
        if (keccak256(abi.encodePacked(_voteType)) == keccak256(abi.encodePacked("valid"))) {
            claims[_id].validVotes++;
        } else if (keccak256(abi.encodePacked(_voteType)) == keccak256(abi.encodePacked("invalid"))) {
            claims[_id].invalidVotes++;
        } else if (keccak256(abi.encodePacked(_voteType)) == keccak256(abi.encodePacked("unverifiable"))) {
            claims[_id].unverifiableVotes++;
        } else if (keccak256(abi.encodePacked(_voteType)) == keccak256(abi.encodePacked("misleading"))) {
            claims[_id].misleadingVotes++;
        }

        emit VoteCast(_id, msg.sender, _voteType);
    }

    // Function to determine the majority vote type
    function determineMajorityVote(uint256 _id) public view returns (string memory) {
        require(_id < numberOfClaims, "Invalid claim ID");

        Claim memory claim = claims[_id];
        uint256 totalVotes = claim.validVotes + claim.invalidVotes + claim.unverifiableVotes + claim.misleadingVotes;

        // Determine the majority vote type
        if (claim.validVotes > totalVotes / 2) {
            return "valid";
        } else if (claim.invalidVotes > totalVotes / 2) {
            return "invalid";
        } else if (claim.unverifiableVotes > totalVotes / 2) {
            return "unverifiable";
        } else if (claim.misleadingVotes > totalVotes / 2) {
            return "misleading";
        } else {
            return "no majority";
        }
    }

    // Function to distribute rewards based on the majority vote
    function distributeRewards(uint256 _id) public nonReentrant {
        require(_id < numberOfClaims, "Invalid claim ID");
        require(block.timestamp >= claims[_id].creationTime + votingPeriod, "Voting period not over yet");

        string memory majorityVote = determineMajorityVote(_id);
        if (keccak256(abi.encodePacked(majorityVote)) == keccak256(abi.encodePacked("no majority"))) {
            return;
        }

        uint256 totalRewards = 0;
        uint256 claimPosterReward = 0;

        // Limit the number of votes processed at a time to prevent DoS
        uint256 maxVotesToProcess = 100;
        uint256 votesProcessed = 0;

        for (uint256 i = 0; i < claimVotes[_id].length && votesProcessed < maxVotesToProcess; i++) {
            Vote memory vote = claimVotes[_id][i];
            if (keccak256(abi.encodePacked(vote.voteType)) == keccak256(abi.encodePacked(majorityVote))) {
                totalRewards += stakeAmount * 2;
            }
            votesProcessed++;
        }

        claimPosterReward = totalRewards / claimPosterRewardRatio;

        for (uint256 i = 0; i < claimVotes[_id].length && votesProcessed < maxVotesToProcess; i++) {
            Vote memory vote = claimVotes[_id][i];
            if (keccak256(abi.encodePacked(vote.voteType)) == keccak256(abi.encodePacked(majorityVote))) {
                payable(vote.voter).transfer(stakeAmount * 2);
                emit RewardDistributed(vote.voter, stakeAmount * 2);
            }
        }

        payable(claims[_id].owner).transfer(claimPosterReward);
        emit RewardDistributed(claims[_id].owner, claimPosterReward);
    }

    // Function to get claim details
    function getClaimDetails(uint256 _id) public view returns (
        string memory title,
        string memory description,
        string memory image,
        string memory source,
        string memory category,
        address owner,
        uint256 validVotes,
        uint256 invalidVotes,
        uint256 unverifiableVotes,
        uint256 misleadingVotes
    ) {
        require(_id < numberOfClaims, "Invalid claim ID");

        Claim memory claim = claims[_id];
        return (
            claim.title,
            claim.description,
            claim.image,
            claim.source,
            claim.category,
            claim.owner,
            claim.validVotes,
            claim.invalidVotes,
            claim.unverifiableVotes,
            claim.misleadingVotes
        );
    }

    // Function to get the total number of claims
    function getNumberOfClaims() public view returns (uint256) {
        return numberOfClaims;
    }
}
