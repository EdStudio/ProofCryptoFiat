pragma solidity ^0.4.18;

import "../interfaces/StoreInterface.sol";
import "../utils/Ownable.sol";
import './SafeMath.sol';

library CryptoDollarStorageProxy {

    using SafeMath for uint256;

    modifier onlyContractManager {
        _;
    }


    //getters
    function getBalance(address _store, address _owner) public view returns(uint256) {
        return StoreInterface(_store).getUint(keccak256("cryptoDollar.balances", _owner));
    }

    function getGuaranteedEther(address _store, address _owner) public view returns(uint256) {
        return StoreInterface(_store).getUint(keccak256("cryptoDollar.guaranteedEther", _owner));
    }

    function getAllowance(address _store, address _from, address _to) public view returns(uint256) {
        return StoreInterface(_store).getUint(keccak256("cryptoDollar.allowed", _from, _to));
    }

    function getTotalSupply(address _store) public view returns(uint256) {
        return StoreInterface(_store).getUint(keccak256("cryptoDollar.totalSupply"));
    }



    //setters
    function setBalance(address _store, address _owner, uint _value) public onlyContractManager {
        return StoreInterface(_store).setUint(keccak256("cryptoDollar.balances", _owner), _value);
    }

    function setGuaranteedEther(address _store, address _owner, uint _value) public onlyContractManager {
        return StoreInterface(_store).setUint(keccak256("cryptoDollar.guaranteedEther", _owner), _value);
    }

    function setAllowance(address _store, address _from, address _to, uint _value) public onlyContractManager {
        return StoreInterface(_store).setUint(keccak256("cryptoDollar.allowed", _from, _to), _value);
    }

    function setTotalSupply(address _store, uint _value) public onlyContractManager {
        return StoreInterface(_store).setUint(keccak256("cryptoDollar.totalSupply"), _value);
    }



    //helpers
    function incrementBalance(address _store, address _owner, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.balances", _owner));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.balances", _owner), balance.add(_value));
    }

    function decrementBalance(address _store, address _owner, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.balances", _owner));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.balances", _owner), balance.sub(_value));
    }

    function incrementTotalSupply(address _store, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.totalSupply"));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.totalSupply"), balance.add(_value));
    }

    function decrementTotalSupply(address _store, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.totalSupply"));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.totalSupply"), balance.sub(_value));
    }

    function incrementGuaranteedEther(address _store, address _owner, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.guaranteedEther", _owner));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.guaranteedEther", _owner), balance.add(_value));
    }

    function decrementGuaranteedEther(address _store, address _owner, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.guaranteedEther", _owner));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.guaranteedEther", _owner), balance.sub(_value));
    }

    function incrementAllowance(address _store, address _from, address _to, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.allowed", _from, _to));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.allowed", _from, _to), balance.add(_value));
    }

    function decrementAllowance(address _store, address _from, address _to, uint _value) public {
        uint256 balance = StoreInterface(_store).getUint(keccak256("cryptoDollar.allowed", _from, _to));
        StoreInterface(_store).setUint(keccak256("cryptoDollar.allowed", _from, _to), balance.sub(_value));
    }


}