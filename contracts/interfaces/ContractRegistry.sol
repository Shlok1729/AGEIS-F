// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FtsoV2Interface.sol";

/**
 * @title ContractRegistry
 * @notice Safe helper for Flare's on-chain contract registry with zero-address fallback
 */
interface IFlareContractRegistry {
    function getContractAddressByName(string calldata _name) external view returns (address);
    function getFtsoV2() external view returns (address);
}

library ContractRegistry {
    // Flare Coston2 Registry Proxy Address
    address internal constant FLARE_CONTRACT_REGISTRY = 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019;
    address internal constant COSTON2_FTSO_V2_DIRECT = 0x3d893c53d9e80E433582fe4091473fC49f11618F;

    function getContractAddressByName(string memory _name) internal view returns (address) {
        if (FLARE_CONTRACT_REGISTRY.code.length == 0) {
            return address(0);
        }
        try IFlareContractRegistry(FLARE_CONTRACT_REGISTRY).getContractAddressByName(_name) returns (address addr) {
            return addr;
        } catch {
            return address(0);
        }
    }

    function getFtsoV2() internal view returns (FtsoV2Interface) {
        if (FLARE_CONTRACT_REGISTRY.code.length > 0) {
            try IFlareContractRegistry(FLARE_CONTRACT_REGISTRY).getFtsoV2() returns (address addr) {
                if (addr != address(0)) {
                    return FtsoV2Interface(addr);
                }
            } catch {}
        }
        return FtsoV2Interface(COSTON2_FTSO_V2_DIRECT);
    }
}
