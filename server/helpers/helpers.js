
const shouldRetry = (error) =>{
    if( error.message.search('out of gas') >= 0 ) return true;   
    if( error.message.search('the tx doesn\'t have the correct nonce') >= 0) return true;
    if( error.message.search('Invalid JSON RPC response: {}') >= 0) return true;
    if( error.message.search('nonce too low') >= 0) return true;
    if( error.message.search('replacement transaction underpriced') >= 0) return true;
    if( error.message.search('nonce too low') >= 0) return true;
    if( error.message.search('same nonce') >= 0) return true;
    if( error.message.search('same hash') >= 0) return true;
    if( error.message.search('known transaction') >= 0) return true;
    return false;    
};

export default { shouldRetry }