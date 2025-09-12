// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ConsulCreditsWrapper
 * @dev Wrapper contract that accepts ERC-20 token deposits and generates consul credit units
 * Designed to integrate with the SOVRCVLT Oracle Ledger system for automated bookkeeping
 */
contract ConsulCreditsWrapper is ERC20, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    // Supported ERC-20 tokens and their exchange rates to consul credits
    mapping(address => uint256) public supportedTokens; // token address => consul credits per token (scaled by 1e18)
    mapping(address => bool) public isTokenSupported;
    
    // Oracle Ledger integration
    address public oracleIntegrator; // Address authorized to mint/burn for Oracle Ledger sync
    
    // Events for Oracle Ledger monitoring
    event TokenDeposited(
        address indexed user,
        address indexed token,
        uint256 tokenAmount,
        uint256 consulCreditsIssued,
        uint256 exchangeRate,
        string ledgerReference
    );
    
    event TokenWithdrawn(
        address indexed user,
        address indexed token,
        uint256 consulCreditsBurned,
        uint256 tokenAmount,
        uint256 exchangeRate,
        string ledgerReference
    );
    
    event ExchangeRateUpdated(
        address indexed token,
        uint256 oldRate,
        uint256 newRate
    );
    
    event OracleIntegratorUpdated(
        address indexed oldIntegrator,
        address indexed newIntegrator
    );

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        // Initialize with 0 supply - tokens are minted on deposit
    }
    
    /**
     * @dev Add or update supported token and its exchange rate
     * @param token ERC-20 token contract address
     * @param consulCreditsPerToken How many consul credits per 1 token (scaled by 1e18)
     */
    function setSupportedToken(address token, uint256 consulCreditsPerToken) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(consulCreditsPerToken > 0, "Exchange rate must be positive");
        
        uint256 oldRate = supportedTokens[token];
        supportedTokens[token] = consulCreditsPerToken;
        isTokenSupported[token] = true;
        
        emit ExchangeRateUpdated(token, oldRate, consulCreditsPerToken);
    }
    
    /**
     * @dev Remove support for a token
     * @param token ERC-20 token contract address
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(isTokenSupported[token], "Token not supported");
        
        delete supportedTokens[token];
        isTokenSupported[token] = false;
        
        emit ExchangeRateUpdated(token, supportedTokens[token], 0);
    }
    
    /**
     * @dev Set the Oracle integrator address for automated ledger sync
     * @param newIntegrator Address authorized to mint/burn for Oracle Ledger operations
     */
    function setOracleIntegrator(address newIntegrator) external onlyOwner {
        address oldIntegrator = oracleIntegrator;
        oracleIntegrator = newIntegrator;
        emit OracleIntegratorUpdated(oldIntegrator, newIntegrator);
    }
    
    /**
     * @dev Deposit ERC-20 tokens and receive consul credits
     * @param token ERC-20 token contract address
     * @param tokenAmount Amount of tokens to deposit
     * @param ledgerReference Reference for Oracle Ledger integration
     */
    function depositToken(
        address token,
        uint256 tokenAmount,
        string calldata ledgerReference
    ) external nonReentrant whenNotPaused {
        require(isTokenSupported[token], "Token not supported");
        require(tokenAmount > 0, "Amount must be positive");
        
        // Calculate consul credits to issue
        uint256 exchangeRate = supportedTokens[token];
        uint256 consulCreditsToIssue = (tokenAmount * exchangeRate) / 1e18;
        require(consulCreditsToIssue > 0, "Insufficient amount for conversion");
        
        // Transfer tokens from user to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Mint consul credits to user
        _mint(msg.sender, consulCreditsToIssue);
        
        emit TokenDeposited(
            msg.sender,
            token,
            tokenAmount,
            consulCreditsToIssue,
            exchangeRate,
            ledgerReference
        );
    }
    
    /**
     * @dev Withdraw ERC-20 tokens by burning consul credits
     * @param token ERC-20 token contract address
     * @param consulCreditsAmount Amount of consul credits to burn
     * @param ledgerReference Reference for Oracle Ledger integration
     */
    function withdrawToken(
        address token,
        uint256 consulCreditsAmount,
        string calldata ledgerReference
    ) external nonReentrant whenNotPaused {
        require(isTokenSupported[token], "Token not supported");
        require(consulCreditsAmount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= consulCreditsAmount, "Insufficient consul credits");
        
        // Calculate tokens to return
        uint256 exchangeRate = supportedTokens[token];
        uint256 tokenAmount = (consulCreditsAmount * 1e18) / exchangeRate;
        require(tokenAmount > 0, "Insufficient amount for conversion");
        require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "Insufficient token reserves");
        
        // Burn consul credits from user
        _burn(msg.sender, consulCreditsAmount);
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, tokenAmount);
        
        emit TokenWithdrawn(
            msg.sender,
            token,
            consulCreditsAmount,
            tokenAmount,
            exchangeRate,
            ledgerReference
        );
    }
    
    /**
     * @dev Oracle Ledger integration - mint consul credits for off-chain operations
     * @param to Address to mint credits to
     * @param amount Amount of consul credits to mint
     * @param ledgerReference Oracle Ledger reference
     */
    function oracleMint(
        address to,
        uint256 amount,
        string calldata ledgerReference
    ) external {
        require(msg.sender == oracleIntegrator, "Only Oracle integrator can mint");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        
        _mint(to, amount);
        
        // Emit event for tracking - using zero address to indicate Oracle mint
        emit TokenDeposited(to, address(0), 0, amount, 1e18, ledgerReference);
    }
    
    /**
     * @dev Oracle Ledger integration - burn consul credits for off-chain operations
     * @param from Address to burn credits from
     * @param amount Amount of consul credits to burn
     * @param ledgerReference Oracle Ledger reference
     */
    function oracleBurn(
        address from,
        uint256 amount,
        string calldata ledgerReference
    ) external {
        require(msg.sender == oracleIntegrator, "Only Oracle integrator can burn");
        require(from != address(0), "Invalid address");
        require(amount > 0, "Amount must be positive");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        
        // Emit event for tracking - using zero address to indicate Oracle burn
        emit TokenWithdrawn(from, address(0), amount, 0, 1e18, ledgerReference);
    }
    
    /**
     * @dev Get exchange rate for a supported token
     * @param token ERC-20 token contract address
     * @return consul credits per token (scaled by 1e18)
     */
    function getExchangeRate(address token) external view returns (uint256) {
        require(isTokenSupported[token], "Token not supported");
        return supportedTokens[token];
    }
    
    /**
     * @dev Calculate consul credits for a given token amount
     * @param token ERC-20 token contract address
     * @param tokenAmount Amount of tokens
     * @return Amount of consul credits that would be issued
     */
    function calculateConsulCredits(address token, uint256 tokenAmount) external view returns (uint256) {
        require(isTokenSupported[token], "Token not supported");
        return (tokenAmount * supportedTokens[token]) / 1e18;
    }
    
    /**
     * @dev Calculate token amount for a given consul credits amount
     * @param token ERC-20 token contract address
     * @param consulCreditsAmount Amount of consul credits
     * @return Amount of tokens that would be returned
     */
    function calculateTokenAmount(address token, uint256 consulCreditsAmount) external view returns (uint256) {
        require(isTokenSupported[token], "Token not supported");
        return (consulCreditsAmount * 1e18) / supportedTokens[token];
    }
    
    /**
     * @dev Get contract reserves for a specific token
     * @param token ERC-20 token contract address
     * @return Token balance held by this contract
     */
    function getTokenReserves(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Emergency pause functionality
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause functionality
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency token withdrawal by owner (only for stuck tokens)
     * @param token ERC-20 token contract address
     * @param to Destination address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid destination");
        IERC20(token).safeTransfer(to, amount);
    }
}