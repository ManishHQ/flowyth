// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract FlexiblePythContract {
    IPyth public immutable pyth;

    // Supported cryptocurrency price feed IDs
    bytes32 public constant BTC_USD_PRICE_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant SOL_USD_PRICE_ID = 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d;

    enum CryptoType { BTC, ETH, SOL }

    event PriceUpdated(bytes32 indexed priceId, uint256 price, uint256 timestamp);
    event MultiplePricesUpdated(bytes32[] priceIds, uint256[] prices, uint256 timestamp);

    constructor(address _pyth) {
        pyth = IPyth(_pyth);
    }

    // Generic functions (like your PythSample)
    function getLatestPrice(bytes32 priceId, bytes[] calldata priceUpdate)
        public payable returns (PythStructs.Price memory) {
        uint256 updateFee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{ value: updateFee }(priceUpdate);

        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, 60);

        uint256 price18Decimals = (uint256(uint64(price.price)) * (10 ** 18)) /
            (10 ** uint8(uint32(-1 * price.expo)));

        emit PriceUpdated(priceId, price18Decimals, block.timestamp);
        return price;
    }

    function getLatestPrices(bytes32[] calldata priceIds, bytes[] calldata priceUpdates)
        public payable returns (PythStructs.Price[] memory) {
        uint256 updateFee = pyth.getUpdateFee(priceUpdates);
        pyth.updatePriceFeeds{ value: updateFee }(priceUpdates);

        PythStructs.Price[] memory prices = new PythStructs.Price[](priceIds.length);
        uint256[] memory prices18Decimals = new uint256[](priceIds.length);

        for (uint256 i = 0; i < priceIds.length; i++) {
            prices[i] = pyth.getPriceNoOlderThan(priceIds[i], 60);
            prices18Decimals[i] = (uint256(uint64(prices[i].price)) * (10 ** 18)) /
                (10 ** uint8(uint32(-1 * prices[i].expo)));
        }

        emit MultiplePricesUpdated(priceIds, prices18Decimals, block.timestamp);
        return prices;
    }

    // Specialized functions for your three cryptos
    function getPriceId(CryptoType cryptoType) public pure returns (bytes32) {
        if (cryptoType == CryptoType.BTC) return BTC_USD_PRICE_ID;
        if (cryptoType == CryptoType.ETH) return ETH_USD_PRICE_ID;
        if (cryptoType == CryptoType.SOL) return SOL_USD_PRICE_ID;
        revert UnsupportedCrypto();
    }

    function getCryptoPrice(CryptoType cryptoType, bytes[] calldata priceUpdate)
        public payable returns (PythStructs.Price memory) {
        bytes32 priceId = getPriceId(cryptoType);
        return getLatestPrice(priceId, priceUpdate);
    }

    function getAllCryptoPrices(bytes[] calldata priceUpdates)
        public payable returns (PythStructs.Price[] memory) {
        bytes32[] memory priceIds = new bytes32[](3);
        priceIds[0] = BTC_USD_PRICE_ID;
        priceIds[1] = ETH_USD_PRICE_ID;
        priceIds[2] = SOL_USD_PRICE_ID;

        return getLatestPrices(priceIds, priceUpdates);
    }

    // View functions (no price updates required)
    function getPrice(bytes32 priceId) external view returns (PythStructs.Price memory) {
        return pyth.getPriceUnsafe(priceId);
    }

    function getPriceNoOlderThan(bytes32 priceId, uint256 age)
        external view returns (PythStructs.Price memory) {
        return pyth.getPriceNoOlderThan(priceId, age);
    }

    function getCryptoPriceView(CryptoType cryptoType)
        external view returns (PythStructs.Price memory) {
        bytes32 priceId = getPriceId(cryptoType);
        return pyth.getPriceUnsafe(priceId);
    }

    // Calculate required payment for a specific USD amount
    function calculatePaymentRequired(
        bytes32 priceId,
        uint256 targetUsdValue,
        uint256 maxAge
    ) external view returns (uint256) {
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, maxAge);

        uint256 cryptoPrice18Decimals = (uint256(uint64(price.price)) * (10 ** 18)) /
            (10 ** uint8(uint32(-1 * price.expo)));

        return (targetUsdValue * (10 ** 18)) / cryptoPrice18Decimals;
    }

    // Utility functions
    function formatPrice(PythStructs.Price memory price)
        external pure returns (uint256) {
        return (uint256(uint64(price.price)) * (10 ** 18)) /
            (10 ** uint8(uint32(-1 * price.expo)));
    }

    // Emergency functions
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}

    // Errors
    error UnsupportedCrypto();
}