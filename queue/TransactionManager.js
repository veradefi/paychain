import { getTransactionCount, signTransaction, web3 } from '../server/lib/web3';
import { decrypt } from '../server/helpers/crypto';
import config from '../config/config'

class TransactionManager {

    generateTransaction (nonce, params) {
        const txOptions = {
            nonce: web3.utils.toHex(nonce),
            gasLimit: web3.utils.toHex('6000000'),
            gasPrice: web3.utils.toHex('3000000000'),
            from: params.from,
        };

        txOptions.to = params.contractAddress;
        txOptions.data = web3.eth.abi.encodeFunctionCall({
            name: 'sendTransactions',
            type: 'function',
            inputs: [{
                type: 'address[]',
                name: 'recipients',
            }, {
                type: 'uint256[]',
                name: 'amounts',
            }],
        }, [params.addresses, params.amounts]);

        return txOptions;
    };

    sendBatchTransactions (nonce, transactions, pendingCallback, successCallback, errorCallback, batchCallback) {
        // getTransactionCount(queue.fromAddress)
        // .then((nonce) => {
            const batch = new web3.BatchRequest();
            const chunk = transactions.length;
            const length = transactions.length;
            const transactionsChunks = [transactions];

            // for (let i = 0; i < length; i += chunk) {
            //     transactionsChunks.push( transactions.slice(i, i+chunk) );
            // }
            
            Promise.all(transactionsChunks.map((transactionsChunk, index) => {

                const _nonce      = parseInt(nonce + index);
                transactionsChunk = transactionsChunk.map(transaction => JSON.parse(transaction));

                const addresses   = transactionsChunk.map(transaction => transaction.fromAcc.address);
                const amounts     = transactionsChunk.map(transaction => transaction.amount);

                const params = {
                    contractAddress: config.web3.contract_address,
                    from: config.web3.default_address,
                    privateKey: config.web3.private_key,
                    amounts: amounts,
                    addresses: addresses
                };

                const slottransaction = this.generateTransaction(_nonce, params);
                const decryptedPrivKey = decrypt(params.privateKey);
                const signedTx = signTransaction(slottransaction, decryptedPrivKey);
                batch.add(web3.eth.sendSignedTransaction.request(signedTx, 'receipt', (err, transactionHash) => {
                    if (err) {
                        console.log("An error occurred" + err.toString());
                        transactionsChunk.map(transaction => {
                            return errorCallback(transaction, err, _nonce);
                        });

                        batchCallback(err.toString());
                    } else {
                        console.log(transactionHash);

                        transactionsChunk.map(transaction => {
                            return pendingCallback(transaction, transactionHash, _nonce);
                        });

                        batchCallback();
                    }
                }));
            }));

            batch.execute();
        // });
    }
}

export default TransactionManager;
