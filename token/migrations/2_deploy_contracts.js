var ChainPayContract = artifacts.require("./ChainPayContract.sol");
var chainpayCoin= artifacts.require("./chainpayCoin.sol");
//var chainpayCoinSale = artifacts.require("./chainpayCoinSale.sol");

module.exports = function(deployer, network, accounts) {
	deployer.deploy(chainpayCoin).then(function(){
		chainpayCoin.deployed().then(async function(tokenInstance) {
			console.log('=======================================');
			console.log('chainpayCoin : ', tokenInstance.address);
			console.log('=======================================');


			deployer.deploy(ChainPayContract, tokenInstance.address).then(function() {
				ChainPayContract.deployed().then(async function(saleInstance) {

					console.log('=======================================');
					console.log('Chainpay: ', saleInstance.address);
					console.log('=======================================');

				});
			});
		});
	});
};
