pragma solidity ^0.4.19;

contract SimpleERC20Token {
    mapping (address => uint256) public balanceOf;

    string public name = "Simple ERC20 Token";
    string public symbol = "SET";
    uint8 public decimals = 18;

    uint256 public totalSupply = 1000000 * (uint256(10) ** decimals);
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() public {
        // Initially assign all tokens to the contract's creator.
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value);
    
        balanceOf[msg.sender] -= value;           // deduct from sender's balance
        balanceOf[to] += value;                  // add to recipient's balance
    
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value)
    public
    returns (bool success)
    {
        require(value <= balanceOf[from]);
        require(value <= allowance[from][msg.sender]);
    
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }

}

contract ChainPayContract {
    
    SimpleERC20Token token;
    address owner;
    
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    constructor(SimpleERC20Token _token) public {
        token = _token;
        owner = msg.sender;
    }
    
    function sendTransactions(address[] recipients, uint256[] amounts) public {
        require(recipients.length == amounts.length);
        
        for(uint256 i = 0; i < recipients.length; i++) {
            token.transferFrom(owner, recipients[i], amounts[i]);
        }
    }
    
    function setTokenAddress(SimpleERC20Token token_) public onlyOwner {
        require(token_ != address(0));
        token = token_;
    }
    
    function getTokenAddress() public view returns(SimpleERC20Token) {
        return token;
    }
    
    function getOwnerAddress() public view returns(address) {
        return owner;
    }

}
