pragma solidity ^0.4.18;

contract SimpleERC20Token {
    mapping (address => uint256) public balanceOf;

    string public name = "Simple ERC20 Token";
    string public symbol = "SET";
    uint8 public decimals = 18;

    uint256 public totalSupply = 1000000 * (uint256(10) ** decimals);
    mapping(address => mapping(address => uint256)) public allowance;

    ChainPayContract chainpayContract;
    address owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    modifier onlyChainpayContract {
        require(msg.sender == address(chainpayContract));
        _;
    }
    
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    
    constructor() public {
        // Initially assign all tokens to the contract's creator.
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function setOwnerAddress(address owner_) public onlyOwner {
        require(address(owner_) != address(0));
        owner = owner_;
    }
    
    function getOwnerAddress() public view returns(address) {
        return owner;
    }
    
    function setChainpayAddress(ChainPayContract chainpayContract_) public onlyOwner {
        require(address(chainpayContract_) != address(0));
        chainpayContract = chainpayContract_;
    }
    
    function getChainpayAddress() public view returns(address) {
        return address(chainpayContract);
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
    
    function transferFromUsingContract(address from, address to, uint256 value) 
    public
    onlyChainpayContract
    returns (bool success) {
        require(value <= balanceOf[from]);

        balanceOf[from] -= value;
        balanceOf[to] += value;
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
    
    function sendTransactions(address[] memory senders, address[] memory recipients, uint256[] memory amounts) public {
        require(senders.length == recipients.length);
        require(recipients.length == amounts.length);

        for(uint256 i = 0; i < recipients.length; i++) {
            token.transferFromUsingContract(senders[i], recipients[i], amounts[i]);
        }
    }
    
    function setTokenAddress(SimpleERC20Token token_) public onlyOwner {
        require(address(token_) != address(0));
        token = token_;
    }
    
    function getTokenAddress() public view returns(SimpleERC20Token) {
        return token;
    }
    
    function setOwnerAddress(address owner_) public onlyOwner {
        require(address(owner_) != address(0));
        owner = owner_;
    }
    
    function getOwnerAddress() public view returns(address) {
        return owner;
    }

}
