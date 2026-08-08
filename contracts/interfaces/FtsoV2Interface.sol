// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FtsoV2Interface
 * @notice Interface for Flare's FTSOv2 block-latency price feeds (~1.8s updates)
 */
interface FtsoV2Interface {
    /**
     * @notice Get current feed value by 21-byte ID
     * @param _feedId 21-byte feed identifier (e.g. 0x01 + "FLR/USD" right-padded)
     * @return _value Price value
     * @return _decimals Number of decimals
     * @return _timestamp Last updated timestamp
     */
    function getFeedById(
        bytes21 _feedId
    ) external payable returns (
        uint256 _value,
        int8 _decimals,
        uint64 _timestamp
    );

    /**
     * @notice Get current feed value converted to 18-decimal Wei format
     * @param _feedId 21-byte feed identifier
     * @return _value Price value in Wei (18 decimals)
     * @return _timestamp Last updated timestamp
     */
    function getFeedByIdInWei(
        bytes21 _feedId
    ) external payable returns (
        uint256 _value,
        uint64 _timestamp
    );

    /**
     * @notice Batch fetch multiple feeds by ID
     */
    function getFeedsById(
        bytes21[] calldata _feedIds
    ) external payable returns (
        uint256[] memory _values,
        int8[] memory _decimals,
        uint64 _timestamp
    );

    /**
     * @notice Batch fetch multiple feeds by ID in Wei format
     */
    function getFeedsByIdInWei(
        bytes21[] calldata _feedIds
    ) external payable returns (
        uint256[] memory _values,
        uint64 _timestamp
    );
}
