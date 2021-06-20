var FreedomCoin = artifacts.require("./FreedomCoin.sol");
var FreedomCoinSale = artifacts.require("./FreedomCoinSale.sol");
var ChainpayContract = artifacts.require("./ChainpayContract.sol");

module.exports = function(deployer, network, accounts) {
	deployer.deploy(FreedomCoin).then(function(){
		FreedomCoin.deployed().then(async function(tokenInstance) {
			console.log('Deploying FreedomCoin Smart Contract ... ' );
			console.log('=======================================');
			console.log('FreedomCoin : ', tokenInstance.address);
			console.log('=======================================');

			//deployer.deploy(FreedomCoinSale, tokenInstance.address).then(function() {
				//FreedomCoinSale.deployed().then(async function(saleInstance) {

                    //console.log('Deploying Sale Smart Contract ... ' );
                    //console.log('=======================================');
					//console.log('FreedomCoinSale : ', saleInstance.address);
					//console.log('=======================================');

				//});
			//});

			deployer.deploy(ChainpayContract, tokenInstance.address).then(function() {
				ChainpayContract.deployed().then(async function(chainpayInstance) {

                    console.log('Deploying Chainpay Smart Contract ... ' );
                    console.log('=======================================');
					console.log('ChainpayContract : ', chainpayInstance.address);
					console.log('=======================================');

				});
			});

		});
	});
};
