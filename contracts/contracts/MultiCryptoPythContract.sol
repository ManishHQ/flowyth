// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract MultiCryptoPythContract {
    IPyth public immutable pyth;

    // Supported cryptocurrency price feed IDs
    bytes32 public constant BTC_USD_PRICE_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant SOL_USD_PRICE_ID = 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d;

    enum CryptoType { BTC, ETH, SOL }

    struct MintParams {
        CryptoType cryptoType;
        uint256 targetUsdValue; // Target USD value in 18 decimals (e.g., 1e18 for $1)
    }

    event NFTMinted(address indexed user, CryptoType cryptoType, uint256 paidAmount, uint256 cryptoPrice);
    event PriceUpdate(CryptoType cryptoType, uint256 price, uint256 timestamp);

    constructor(address _pyth) {
        pyth = IPyth(_pyth);
    }

    function getPriceId(CryptoType cryptoType) public pure returns (bytes32) {
        if (cryptoType == CryptoType.BTC) return BTC_USD_PRICE_ID;
        if (cryptoType == CryptoType.ETH) return ETH_USD_PRICE_ID;
        if (cryptoType == CryptoType.SOL) return SOL_USD_PRICE_ID;
        revert UnsupportedCrypto();
    }

    function mint(MintParams calldata params) public payable {
        bytes32 priceId = getPriceId(params.cryptoType);

        // Get the price if it is not older than 60 seconds
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, 60);

        // Convert price to 18 decimals
        uint256 cryptoPrice18Decimals = (uint256(uint64(price.price)) * (10 ** 18)) /
            (10 ** uint8(uint32(-1 * price.expo)));

        // Calculate required payment in wei
        uint256 requiredPaymentInWei = (params.targetUsdValue * (10 ** 18)) / cryptoPrice18Decimals;

        if (msg.value >= requiredPaymentInWei) {
            // User paid enough money
            emit NFTMinted(msg.sender, params.cryptoType, msg.value, cryptoPrice18Decimals);
            // TODO: mint the NFT here
        } else {
            revert InsufficientFee(msg.value, requiredPaymentInWei);
        }

        emit PriceUpdate(params.cryptoType, cryptoPrice18Decimals, block.timestamp);
    }

    function updateAndMint(
        bytes[] calldata pythPriceUpdate,
        MintParams calldata params
    ) external payable {
        uint256 updateFee = pyth.getUpdateFee(pythPriceUpdate);
        pyth.updatePriceFeeds{ value: updateFee }(pythPriceUpdate);

        // Forward remaining value to mint function
        uint256 remainingValue = msg.value - updateFee;
        require(remainingValue > 0, "No value left after update fee");

        // Call mint with remaining value
        this.mint{ value: remainingValue }(params);
    }

    function getPrice(CryptoType cryptoType) external view returns (PythStructs.Price memory) {
        bytes32 priceId = getPriceId(cryptoType);
        return pyth.getPriceUnsafe(priceId);
    }

    function getPriceNoOlderThan(
        CryptoType cryptoType,
        uint256 age
    ) external view returns (PythStructs.Price memory) {
        bytes32 priceId = getPriceId(cryptoType);
        return pyth.getPriceNoOlderThan(priceId, age);
    }

    function calculateRequiredPayment(
        CryptoType cryptoType,
        uint256 targetUsdValue
    ) external view returns (uint256) {
        bytes32 priceId = getPriceId(cryptoType);
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, 300); // 5 minutes max

        uint256 cryptoPrice18Decimals = (uint256(uint64(price.price)) * (10 ** 18)) /
            (10 ** uint8(uint32(-1 * price.expo)));

        return (targetUsdValue * (10 ** 18)) / cryptoPrice18Decimals;
    }

    // Withdraw function for contract owner (if needed)
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Errors
    error InsufficientFee(uint256 paid, uint256 required);
    error UnsupportedCrypto();
}