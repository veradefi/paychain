var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "wife sheriff rough kiss toy lottery wrap nuclear foster zoo victory hand fossil sign furnace";
module.exports = {
  compilers: {
    solc: {
      version: "0.4.26"
    }
  },
  networks: {
    dev: {
         provider: function() {
                return new HDWalletProvider(mnemonic, "https://mistakenly-smart-jay.quiknode.io/86d9e35e-8cdb-47ad-80a4-84f9e9537afa/C0_tKUunhUc0rM_i1HMxHA==/");
            },
        from:"0x5a1c3D8C9435B1897cc2972e2530EE6217C02FC5",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 10000000000
    }
  }
};
