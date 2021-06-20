module.exports = {
  compilers: {
    solc: {
      version: "0.4.26"
    }
  },
  networks: {
    dev: {
      host: "18.218.117.111",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0x5a1c3D8C9435B1897cc2972e2530EE6217C02FC5",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 10000000000
    }
  }
};
