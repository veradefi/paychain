module.exports = {
  compilers: {
    solc: {
      version: "0.4.26"
    }
  },
  networks: {
          local: {
                    host: "localhost",
                    port: 8545,
                    network_id: "*" // Match any network id
                  },

    pre196: {
      host: "13.59.48.196",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0x258dF203AE22B0A69E226Ca945E7ff5527700232",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 9100100100  // 
    },

    196: {
      host: "13.59.48.196",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0x0ded6394cab7695c6e50603a09b554b58981d5e4",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 9100100100  // 90 Gwei
    },

    rinkeby: {
      host: "13.58.109.222",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0xaBC287BB515Dc8c04b623080C5B5f1C6220535Ba",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 90000000001  // 90 Gwei
    },
  86: {
      host: "3.14.129.86",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0x0ded6394cab7695c6e50603a09b554b58981d5e4",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 11000000000
    },

  dev: {
      host: "18.223.43.195",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0xaBC287BB515Dc8c04b623080C5B5f1C6220535Ba",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 9000000000
    },
  r2: {
      host: "18.218.117.111",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0xaBC287BB515Dc8c04b623080C5B5f1C6220535Ba",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 9000000000
    },
  gl: {
      host: "18.217.233.236",
      //host: "http://api.infura.io/v1/jsonrpc/mainnet",
      port: 8545,
        from:"0x4608f35b0a0829036e6ff2ca20fe1d74d01ba330",
        network_id: "*", // Match any network id
      gas: 4600000,
      gasPrice: 4000000000
    },




  }
};
