pragma solidity ^0.5.8;


import 'contracts/FreedomCoin.sol';

/**
 * @title FreedomCoin
 * @dev Initial Coin Offering Sale Contract
 */
contract FreedomCoinSale is Ownable {

	using SafeMath for uint256;

	// The token being sold, this holds reference to main token contract
	FreedomCoin public token;

	address[] users;

	event Distribute(address indexed _from, address indexed _to, uint256 _value, string _message);
	event AddUser( address _user, uint _amount, uint _time );

	mapping (address => uint256) public userAmount;

	/**
	* @dev Constructor that initializes token contract with token address in parameter
	*/
	constructor(address payable _token) public {
		// set token
		token = FreedomCoin(_token);
	}

	/**
	 * @dev Default fallback method which will be called when any ethers are sent to contract
	 */
	function() external payable {
		revert();
	}

	function userExists(address _user) internal view returns (bool) {
		for( uint i = 0 ; i < users.length ; i++ ) {
			if(users[i] == _user)

			{
				return true;
			}
		}

		return false;
	}

	function addUser( address _user, uint _amount ) onlyOwner public {
		require(_user != address(0));
		userAmount[_user] = _amount;

		if(!userExists(_user)) {
			users.push(_user);
		}

		emit AddUser( _user, _amount, now);
	}

	// an optimization in case of network congestion
	function addUsers( address[] memory _users, uint[] memory _amounts ) onlyOwner public {
		require(_users.length == _amounts.length);
		for( uint i = 0 ; i < _users.length ; i++ ) {
			addUser( _users[i], _amounts[i] );
		}
	}

	function userCount() onlyOwner public view returns (uint) {
		return users.length;
	}

	/**
	 * @dev Function that validates if the transfer is valid by verifying the parameters
	 *
	 * @return checks various conditions and returns the bool result indicating validition.
	 */	
	function validate() internal view returns (bool) {

		uint256 amount = 0;
		for( uint i = 0 ; i < users.length ; i++ ) {
			amount = amount + userAmount[users[i]];
		}

		// check if value of the tokens is valid
		bool validValue = amount > 0;

		// check if the tokens available in contract for sale
		uint256 balanceOfSale = token.balanceOf(address(this));
		bool validAmount = balanceOfSale >= amount;

		return validValue && validAmount;
	}


	/**
	* @dev Distribute specified number of tokens to listed address. 
	*/
	function distribute() onlyOwner public returns (bool) {
		require(validate());
		for( uint i = 0 ; i < users.length ; i++ ) {
			address userAddr = users[i];
			uint256 amount = userAmount[userAddr];
			
			if(amount > 0) {
				token.transfer(userAddr, amount);
			}
		}
		return true;
	}
}