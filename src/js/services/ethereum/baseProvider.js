import Web3 from "web3"
import constants from "../constants"
import * as ethUtil from 'ethereumjs-util'
import BLOCKCHAIN_INFO from "../../../../env"

export default class BaseEthereumProvider {

  initContract() {
    this.erc20Contract = new this.rpc.eth.Contract(constants.ERC20)
    this.networkAddress = BLOCKCHAIN_INFO.network
    this.networkContract = new this.rpc.eth.Contract(constants.KYBER_NETWORK, this.networkAddress)
  }

  version() {
    return this.rpc.version.api
  }

  getGasPrice(){
    return new Promise((resolve, reject) => {
      this.rpc.eth.getGasPrice().then((result)=>{
        resolve(result)
      })
    })
  }

  isConnectNode() {
    return new Promise((resolve, reject) => {
      this.rpc.eth.getBlock("latest", false).then((block) => {
        if (block != null) {
          resolve(true)
        }else{
          resolve(false)
        }
      }).catch((errr)=>{
        resolve(false)
      })
    })
    // return new Promise((resolve, reject) => {
    //   this.rpc.version.getEthereum().then((result) => {
    //     resolve(true)
    //   }).catch((err) => {
    //     resolve(false)
    //   })
    // })
  }

  getLatestBlock() {
    return new Promise((resolve, rejected) => {
      fetch(BLOCKCHAIN_INFO.history_endpoint + '/getLatestBlock', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      }).then(function (response) {
        resolve(response.json())
      })
    })
    // return new Promise((resolve, reject) => {
    //   this.rpc.eth.getBlock("latest", false).then((block) => {
    //     if (block != null) {
    //       resolve(block.number)
    //     }
    //   })
    // })
  }

  getBalance(address) {
    return new Promise((resolve, reject) => {
      this.rpc.eth.getBalance(address).then((balance) => {
        if (balance != null) {
          resolve(balance)
        }
      })
    })
  }

  getNonce(address) {
    return new Promise((resolve, reject) => {
      this.rpc.eth.getTransactionCount(address, "pending").then((nonce) => {
        //console.log(nonce)
        if (nonce != null) {
          resolve(nonce)
        }
      })
    })


  }

  getTokenBalance(address, ownerAddr) {
    var instance = this.erc20Contract
    instance.options.address = address
    return new Promise((resolve, reject) => {
      instance.methods.balanceOf(ownerAddr).call().then((result) => {
        if (result != null) {
          resolve(result)
        }
      })
    })

  }

  exchangeData(sourceToken, sourceAmount, destToken, destAddress,
    maxDestAmount, minConversionRate, throwOnFailure) {
    return this.networkContract.methods.trade(
      sourceToken, sourceAmount, destToken, destAddress,
      maxDestAmount, minConversionRate, throwOnFailure).encodeABI()
  }

  approveTokenData(sourceToken, sourceAmount) {
    var tokenContract = this.erc20Contract
    tokenContract.options.address = sourceToken
    return tokenContract.methods.approve(this.networkAddress, sourceAmount).encodeABI()
  }

  sendTokenData(sourceToken, sourceAmount, destAddress) {
    var tokenContract = this.erc20Contract
    tokenContract.options.address = sourceToken
    return tokenContract.methods.transfer(destAddress, sourceAmount).encodeABI()
  }

  getAllowance(sourceToken, owner) {
    var tokenContract = this.erc20Contract
    tokenContract.options.address = sourceToken
    return new Promise((resolve, reject) => {
      tokenContract.methods.allowance(owner, this.networkAddress).call().then((result) => {
        if (result !== null) {
          resolve(result)
        }
      })
    })
  }

  getDecimalsOfToken(token) {
    var tokenContract = this.erc20Contract
    tokenContract.options.address = token
    return new Promise((resolve, reject) => {
      tokenContract.methods.decimals().call().then((result) => {
        if (result !== null) {
          resolve(result)
        }
      })
    })
  }

  txMined(hash) {
    return new Promise((resolve, reject) => {
      this.rpc.eth.getTransactionReceipt(hash).then((result) => {
        if (result != null) {
          resolve(result)
        }
      })
    })

  }

  getRate(source, dest, reserve) {
    return new Promise((resolve, reject) => {
      this.networkContract.methods.getRate(source, dest, reserve).call().then((result) => {
        if (result != null) {
          resolve(result)
        }
      })
    })
  }

  sendRawTransaction(tx) {
    return new Promise((resolve, rejected) => {
      this.rpc.eth.sendSignedTransaction(
        ethUtil.bufferToHex(tx.serialize()), (error, hash) => {
          if (error != null) {
            rejected(error)
          } else {
            resolve(hash)
          }
        })
    })
  }

  countALlEvents() {
    return new Promise((resolve, rejected) => {
      fetch(BLOCKCHAIN_INFO.history_endpoint + '/countHistory', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
      }).then(function (response) {
        resolve(response.json())
      })
    })
  }

  getLogExchange(page, itemPerPage) {
    return new Promise((resolve, rejected) => {
      fetch(BLOCKCHAIN_INFO.history_endpoint + '/getHistory', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: page,
          itemPerPage: itemPerPage - 1,
        })
      }).then(function (response) {
        resolve(response.json())
      })
    })
  }

  getLogTwoColumn(page, itemPerPage) {
    return new Promise((resolve, rejected) => {
      fetch(BLOCKCHAIN_INFO.history_endpoint + '/getHistoryTwoColumn', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        // body: JSON.stringify({
        //   page: page,
        //   itemPerPage: itemPerPage,
        // })
      }).then(function (response) {
        resolve(response.json())
      })
    })
  }

  getRateExchange() {
    return new Promise((resolve, rejected) => {
      fetch(BLOCKCHAIN_INFO.history_endpoint + '/getRate', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        //body: {}
      })
      .then(function (response) {
        if(response.status == 404){
          console.log("~~~~~~~ not founf rate in server ~~~~~~~~")
          this.getRateFromBlockchain().then((result) => {
            resolve(result)
          })
        } else {
          resolve(response.json())
        }
        
      })

      .catch((err) => {
        console.log("-- catch error get rate from server --")
        this.getRateFromBlockchain().then((result) => {
          resolve(result)
        })
      })
    })
  }

  getLanguagePack(lang) {
    return new Promise((resolve, rejected) => {
      fetch(BLOCKCHAIN_INFO.history_endpoint + '/getLanguagePack?lang=' + lang).then(function (response) {
        resolve(response.json())
      }).catch((err) => {
        rejected(err)
      })
    })
  }

  getRateFromBlockchain(){
    var ratePromises = []
    var tokenObj = BLOCKCHAIN_INFO.tokens
    Object.keys(tokenObj).map((tokenName) => {
      ratePromises.push(Promise.all([
        Promise.resolve(tokenName),
        Promise.resolve(constants.ETH.symbol),
        this.getRate(tokenObj[tokenName].address, constants.ETH.address, constants.RESERVES[0].index)
      ]))
      ratePromises.push(Promise.all([
        Promise.resolve(constants.ETH.symbol),
        Promise.resolve(tokenName),
        this.getRate(constants.ETH.address, tokenObj[tokenName].address, constants.RESERVES[0].index)
      ]))
    })
    return Promise.all(ratePromises).then((arrayRate) => {
      var arrayRateObj = arrayRate.map((rate) => {
        return {
          source: rate[0],
          dest: rate[1],
          rate: rate[2].rate,
          expBlock: rate[2].expBlock,
          balance: rate[2].balance
        }
      })
      return arrayRateObj
    })
  }
}
