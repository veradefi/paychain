'use strict';
var assert_throw = require('./utils/utils').assert_throw;
var chainpayCoin = artifacts.require('./chainpayCoin.sol');
var chainpayCoinSale = artifacts.require('./chainpayCoinSale.sol');

const promisify = (inner) =>
	new Promise((resolve, reject) =>
		inner((err, res) => {
			if (err) { reject(err) }
			resolve(res);
		})
);

const getBalance = (account, at) => promisify(cb => web3.eth.getBalance(account, at, cb));

var tokenInstance;
var saleInstance;

var owner;

contract('chainpayCoin' , (accounts) => {
	owner = accounts[0];

	beforeEach(async () => {
		tokenInstance = await chainpayCoin.new({from: owner});
		saleInstance = await chainpayCoinSale.new(tokenInstance.address , {from: owner});
	});

	it('should match name' , async () => {
		var name = await tokenInstance.name.call();
		assert.equal(name , 'ChainpayCoin' , 'name does not match');		
	});

	it('should match name after update' , async () => {
		await tokenInstance.setName('New Name');
		var name = await tokenInstance.name.call();
		assert.equal(name , 'New Name' , 'name does not match');		
	});

	it('should match symbol' , async () => {
		var symbol = await tokenInstance.symbol.call();
		assert.equal(symbol , 'CPC' , 'symbol does not match');		
	});

	it('should match symbol after update' , async () => {
		await tokenInstance.setSymbol('TKN');
		var name = await tokenInstance.symbol.call();
		assert.equal(name , 'TKN' , 'name does not match');		
	});

	it('should match decimals' , async () => {
		var decimals = await tokenInstance.decimals.call();
		assert.equal(decimals , 18 , 'decimals does not match');		
	});

	it('owner should have full balance' , async () => {
		var balance = await tokenInstance.balanceOf.call(owner);

		assert.equal(balance.toNumber(), 500000000 * 1E18 , 'owner balance does not match');		
	});

	it('should match sale token address' , async () => {
		var token = await saleInstance.token.call();
		assert.equal(token , tokenInstance.address , 'token address does not match');		
	});

	it('should transfer tokens from owner' , async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 10E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');
	});

	it('should allow to enable transfer status' , async () => {
		await tokenInstance.enableTransfer();
		var transferStatus = await tokenInstance.transferStatus.call();
		assert.isTrue(transferStatus == true);
	});

	it('should allow to disable transfer status' , async () => {
		await tokenInstance.disableTransfer();
		var transferStatus = await tokenInstance.transferStatus.call();
		assert.isTrue(transferStatus == false);
	});

	it('should allow owner to disable whitelisting' , async () => {
		await tokenInstance.toggleWhitelisting(false);
		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == false);
	});

	it('should allow owner to enable whitelisting' , async () => {
		await tokenInstance.toggleWhitelisting(true);
		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);
	});

	it('should not allow other account to enable whitelisting' , async () => {

		await tokenInstance.toggleWhitelisting(false);

		assert_throw(tokenInstance.toggleWhitelisting(true, {from: accounts[1]}));

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == false);
	});

	it('should not allow other account to disable whitelisting' , async () => {
		await tokenInstance.toggleWhitelisting(true);

		assert_throw(tokenInstance.toggleWhitelisting(false, {from: accounts[1]}));

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);
	});
	
	it('should allow owner to whitelist an account', async () => {
		var account2 = accounts[1];
		
		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);

		var statusBeforeAccount = await tokenInstance.whitelist(account2);
		assert.isTrue(statusBeforeAccount == false);

		await tokenInstance.addAddressToWhitelist(account2)

		var statusAfterAccount = await tokenInstance.whitelist(account2);
		assert.isTrue(statusAfterAccount == true);
	});

	it('should allow owner to remove an account from whitelist', async () => {
		var account2 = accounts[1];
		
		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);

		var statusBeforeAccount = await tokenInstance.whitelist(account2);
		assert.isTrue(statusBeforeAccount == false);

		await tokenInstance.addAddressToWhitelist(account2)

		var statusAfterAccount = await tokenInstance.whitelist(account2);
		assert.isTrue(statusAfterAccount == true);

		await tokenInstance.removeAddressFromWhitelist(account2)

		var statusAfterAccount = await tokenInstance.whitelist(account2);
		assert.isTrue(statusAfterAccount == false);
	});

	it('should not allow other account to whitelist an account', async () => {
		var account2 = accounts[1];
		var account3 = accounts[2];

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);

		var statusBeforeAccount = await tokenInstance.whitelist(account3);
		assert.isTrue(statusBeforeAccount == false);

		assert_throw(tokenInstance.addAddressToWhitelist(account3, {from: account2}));

		var statusAfterAccount = await tokenInstance.whitelist(account3);
		assert.isTrue(statusAfterAccount == false);
	});

	it('should not allow other account to remove an account from whitelist', async () => {
		var account2 = accounts[1];
		var account3 = accounts[2];

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);

		var statusBeforeAccount = await tokenInstance.whitelist(account3);
		assert.isTrue(statusBeforeAccount == false);

		await tokenInstance.addAddressToWhitelist(account3)

		var statusAfterAccount = await tokenInstance.whitelist(account3);
		assert.isTrue(statusAfterAccount == true);

		assert_throw(tokenInstance.removeAddressFromWhitelist(account3, {from: account2}));

		var statusAfterAccount = await tokenInstance.whitelist(account3);
		assert.isTrue(statusAfterAccount == true);
	});

	it('should reject other account to transfer tokens' , async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 10E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);		

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');
		
		var account1 = accounts[1];
		var account2 = owner;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		assert_throw(tokenInstance.transfer(account2 , unit , {from: account1}));
	});

	it('should not allow other account to transfer tokens if it is not whitelisted and whitelisting is enabled', async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 10E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');

		await tokenInstance.enableTransfer();

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);

		var account1 = accounts[1];
		var account2 = owner;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		assert_throw(tokenInstance.transfer(account2 , unit , {from: account1}));
	});

	it('should allow other account to transfer tokens whitelisting is disabled', async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 10E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');

		await tokenInstance.enableTransfer();
		await tokenInstance.toggleWhitelisting(false)

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == false);

		var account1 = accounts[1];
		var account2 = owner;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');
	});

	it('should allow other account to transfer tokens if it is whitelisted and whitelisting is enabled', async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 10E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');

		await tokenInstance.enableTransfer();
		await tokenInstance.addAddressToWhitelist(account2)

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);

		var account1 = accounts[1];
		var account2 = owner;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');
	});

	it('should allow other account to transfer tokens after enable transfer status' , async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 10E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);
		
		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');

		await tokenInstance.enableTransfer();
		await tokenInstance.addAddressToWhitelist(account2);

		var isWhitelistingEnabled = await tokenInstance.getWhitelistingStatus();
		assert.isTrue(isWhitelistingEnabled == true);

		var account1 = accounts[1];
		var account2 = owner;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account2 , unit , {from: account1});

		var balanceAfterSender = await tokenInstance.balanceOf.call(account1);
		var balanceAfterReceiver = await tokenInstance.balanceOf.call(account2);

		assert.equal(balanceBeforeSender.toNumber() , balanceAfterSender.toNumber() + unit , 'sender balance should be decreased');
		assert.equal(balanceBeforeReceiver.toNumber() , balanceAfterReceiver.toNumber() - unit , 'receiver balance should be increased');
	});

	it('should transfer token from one account to another account by Owner' , async () => {
		var owner = accounts[0];
		var account1 = accounts[1];
		var account2 = accounts[2];
		var unit = 100E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account1 , unit , {from: owner});

		await tokenInstance.transmit(account1 , account2 , unit , {from: owner});
	});	

	it('should disable flag for Admin to transfer token from one account to another account' , async () => {
		await tokenInstance.disableTransmit();
		var transmitStatus = await tokenInstance.transmitStatus.call();
		assert.isTrue(transmitStatus == false);
	});

	it('should reject transfer token from one account to another account by Owner when transmit is disabled' , async () => {
		var owner = accounts[0];
		var account1 = accounts[1];
		var account2 = accounts[2];
		var unit = 100E18;

		var balanceBeforeSender = await tokenInstance.balanceOf.call(account1);
		var balanceBeforeReceiver = await tokenInstance.balanceOf.call(account2);

		await tokenInstance.transfer(account1 , unit , {from: owner});

		await tokenInstance.disableTransmit();

		assert_throw(tokenInstance.transmit(account1 , account2 , unit , {from: owner}));
	});

	it('should allow only Owner to add user and amount to list ' , async () => {
		var account1 = accounts[1];
		var account2 = accounts[2];
		var unit = 10E18;
		assert_throw(saleInstance.addUser(account2 , unit , {from: account1}));
	});

	it('should allow only Owner to add multiple users ' , async () => {
		var account1 = accounts[1];
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 2; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E18));
			count = i;
		}

		assert_throw(saleInstance.addUsers(users , amounts , {from: account1}));
	});

	it('should allow Owner to add single user and amount to list ' , async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 10E18;

		await saleInstance.addUser(account2 , unit , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(1 , listCount.toNumber() , 'Count of User List should match after Adding User');		
	});

	it('should allow Owner to add multiple user and amount to list ' , async () => {
		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E18));
			count = i;
		}

		await saleInstance.addUsers(users , amounts , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding Users');		
	});

	it('should reject adding of user to list if users and amount array lengths differs ' , async () => {
		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E18));
			count = i;
		}

		amounts.splice(-1,2)

		assert_throw(saleInstance.addUsers(users , amounts , {from: account1}));
	});

	it('should reject adding of user to list if users address is invalid ' , async () => {
		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push("0x0");
			amounts.push((i * 1E18));
			count = i;
		}

		assert_throw(saleInstance.addUsers(users , amounts , {from: account1}));
	});

	it('should allow Owner to set user with amount equals 0 ' , async () => {
		var account1 = owner;
		var account2 = accounts[1];
		var unit = 0;

		await saleInstance.addUser(account2 , unit , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(1 , listCount.toNumber() , 'Count of User List should match after Adding User');		
	});

	it('should allow Owner to add single user and amount to existing list ' , async () => {

		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < (accounts.length - 1); i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E18));
			count = i;
		}

		await saleInstance.addUsers(users , amounts , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding Users');

		var account2 = accounts[9];
		var unit = 10E18;

		await saleInstance.addUser(account2 , unit , {from: account1});
		count = count + 1;
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding User');		
	});

	it('should only update user amount if already exists' , async () => {

		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E18));
			count = i;
		}

		await saleInstance.addUsers(users , amounts , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding Users');

		var account2 = accounts[1];
		var unit = 10E18;

		await saleInstance.addUser(account2 , unit , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding User');		
	});

	it('should reject distribution of tokens to list of address when Transfer is disable' , async () => {
		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E18));
			count = i;
		}

		await saleInstance.addUsers(users , amounts , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding Users');
		
		assert_throw(saleInstance.distribute({from: account1}));
	});

	it('should reject distribution tokens to list of address when Sale Contract balance is less than amount to transfer' , async () => {
		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E18));
			count = i;
		}

		await saleInstance.addUsers(users , amounts , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding Users');

		await tokenInstance.enableTransfer({from: account1});
		
		assert_throw(saleInstance.distribute({from: account1}));
	});

	it('should reject distribution of tokens to list of address if total of amounts is 0' , async () => {
		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push(0);
			count = i;
		}

		await saleInstance.addUsers(users , amounts , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding Users');

		await tokenInstance.enableTransfer({from: account1});

		await tokenInstance.transfer(saleInstance.address , (10000 * 1E18), {from: account1});
		
		assert_throw(saleInstance.distribute({from: account1}));
	});

	it('should distribute tokens to list of address' , async () => {
		var account1 = owner;
		var users = [];
		var amounts = [];
		var count = 0;
		for (var i = 1; i < accounts.length; i++) {
			users.push(accounts[i]);
			amounts.push((i * 1E15));
			count = i;
		}

		await saleInstance.addUsers(users , amounts , {from: account1});
		var listCount = await saleInstance.userCount(); 
		assert.equal(count , listCount.toNumber() , 'Count of User List should match after Adding Users');

		await tokenInstance.enableTransfer({from: account1});

		await tokenInstance.toggleWhitelisting(false);

		await tokenInstance.transfer(saleInstance.address , (10000 * 1E18), {from: account1});
		
		await saleInstance.distribute({from: account1});

		await tokenInstance.disableTransfer({from: account1});

		for (var i = 1; i < users.length; i++) {
			var balance = await tokenInstance.balanceOf.call(users[i]);
			assert.equal(balance.toNumber() , amounts[i] , 'Balance of User in list should be equal to amount after transfer');
		}
	});
});
