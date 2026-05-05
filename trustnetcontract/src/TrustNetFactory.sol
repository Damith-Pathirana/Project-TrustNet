// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TrustNet.sol"; // Ensure this path is correct

contract TrustNetsFactory {
    address public owner; // Store the address of the contract owner

    // Define a structure to store claim details
    struct ClaimInstance {
        address claimAddress; // Address of the claim contract
        address owner; // Address of the claim owner
        string title; // Title of the claim
        uint256 creationTime; // Timestamp when the claim was created
        string category; // Category of the claim
    }

    ClaimInstance[] public claims; // Array to store all claims
    mapping(address => ClaimInstance[]) public userClaims; // Mapping to store claims by user
    mapping(bytes32 => bool) public contentHashes; // Mapping to store content hashes for uniqueness check

    // Event to log claim creation
    event ClaimCreated(address indexed claimAddress, address indexed owner, string title, string category);

    // Modifier to restrict access to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    // Constructor to set the contract owner
    constructor() {
        owner = msg.sender;
    }

    // Function to create a new TrustNets claim
    function createClaimInstance(
        string memory _title,
        string memory _description,
        string memory _image,
        string memory _source,
        string memory _category
    ) external {
        // Create a unique hash for the content to check for duplicates
        bytes32 contentHash = keccak256(abi.encodePacked(_title, _description, _image, _source, _category));

        // Check if the content hash already exists
        require(!contentHashes[contentHash], "Content already exists");

        // Mark the content hash as used
        contentHashes[contentHash] = true;

        // Create a new instance of the TrustNets contract
        TrustNet newClaim = new TrustNet();

        // Store the address of the new claim
        address claimAddress = address(newClaim);

        // Create a new ClaimInstance struct to store claim details
        ClaimInstance memory claim = ClaimInstance({
            claimAddress: claimAddress,
            owner: msg.sender,
            title: _title,
            creationTime: block.timestamp,
            category: _category
        });

        // Add the new claim to the list of claims
        claims.push(claim);
        userClaims[msg.sender].push(claim);

        // Initialize the new TrustNets claim with the provided claim details
        newClaim.createClaim(_title, _description, _image, _source, _category);

        // Emit an event to log the creation of the claim
        emit ClaimCreated(claimAddress, msg.sender, _title, _category);
    }

    // Function to get claims created by a specific user
    function getUserClaims(address _user) external view returns (ClaimInstance[] memory) {
        return userClaims[_user];
    }

    // Function to get all claims
    function getAllClaims() external view returns (ClaimInstance[] memory) {
        return claims;
    }
}
