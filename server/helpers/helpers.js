
const shouldRetry = (error) =>{
    if( error.message.search('out of gas') >= 0 ) return true;   
    if( error.message.search('the tx doesn\'t have the correct nonce') >= 0) return true;
    return false;    
};

export default { shouldRetry }