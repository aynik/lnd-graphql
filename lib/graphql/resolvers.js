const { GraphQLDateTime } = require('graphql-iso-date')
const { PubSub, withFilter } = require('graphql-subscriptions')

const pubsub = new PubSub()

const resolve = function (method, before, after, root, args, ctx) {
  args = before(args || {}, root)
  return new Promise((resolve, reject) => (
    this[method](args, this.metadata, (err, res) => {
      if (err) return reject(err)
      resolve(after(res || {}, ctx))
    })
  ))
}

const subscribe = function (method, before, after) {
  return ({
    subscribe: (root, args) => {
      args = before(args || {}, root)
      const publish = (payload) => pubsub.publish(method, payload)
      const subscription = this[method](this.metadata, args)
      subscription.on('data', publish).on('error', publish)
      return pubsub.asyncIterator(method)
    },
    resolve: (payload, args, ctx, info) => {
      if (payload instanceof Error) throw payload
      return after(payload, ctx)
    }
  })
}

const buildResolvers = (connection) => ({
  Query: {
    getWalletBalance: resolve.bind(connection,
      'WalletBalance',
      ({ witnessOnly = false }) => ({ witness_only: witnessOnly }),
      (res) => res 
    ),
    getChannelBalance: resolve.bind(connection,
      'ChannelBalance', (_) => ({}), (res) => res 
    ),
    getTransactions: resolve.bind(connection,
      'GetTransactions',
      (_) => ({}),
      ({ transactions }) => transactions.map((transaction) => ({
        txHash: transaction.tx_hash,
        amount: transaction.amount,
        numConfirmations: transaction.num_confirmations,
        blockHash: transaction.block_hash,
        blockHeight: transaction.block_height,
        createdOn: parseInt(transaction.time_stamp, 10) ?
          new Date(parseInt(transaction.time_stamp, 10) * 1e3) : undefined,
        totalFees: transaction.total_fees
      }))
    ),
    listPeers: resolve.bind(connection,
      'ListPeers',
      (_) => ({}),
      ({ peers }) => peers.map((peer) => ({
        id: peer.peer_id,
        publicKey: peer.pub_key,
        address: peer.address,
        bytesSent: peer.bytes_sent,
        bytesReceived: peer.bytes_recv,
        amountSent: peer.sat_sent,
        amountReceived: peer.sat_recv,
        pingTime: peer.ping_time,
        isInbound: peer.inbound
      }))
    ),
    getInfo: resolve.bind(connection,
      'GetInfo',
      (_) => ({}),
      (output) => ({
        publicKey: output.identity_pubkey,
        alias: output.alias,
        pendingChannels: output.num_pending_channels,
        activeChannels: output.num_active_channels,
        connectedPeers: output.num_peers,
        blockHeight: output.block_height,
        blockHash: output.block_hash,
        chains: output.chains,
        isSynchronized: output.synced_to_chain,
        isTestnet: output.testnet
      })
    ),
    pendingChannels: resolve.bind(connection,
      'PendingChannels',
      (_) => ({}),
      (output) => ({
        amountInLimbo: output.total_limbo_balance,
        pendingOpen: output.pending_open_channels
          .map((channel) => ({
            channel: channel.channel,
            confirmationHeight: channel.confirmation_height,
            blocksUntilOpen: channel.blocks_till_open,
            commitFee: channel.commit_fee,
            commitWeight: channel.commit_weight,
            feePerKw: channel.fee_per_kw
          })
        ),
        pendingClose: output.pending_closing_channels
          .map((channel) => ({
            channel: channel.channel,
            closingTxHash: channel.closing_txid
          })
        ),
        pendingForceClose: output.pending_force_closing_channels
          .map((channel) => ({
            channel: channel.channel,
            closingTxHash: channel.closing_txid,
            amountInLimbo: channel.limbo_balance,
            maturityHeight: channel.maturity_height,
            blocksUntilMaturity: channel.blocks_til_maturity
          })
        )
      })
    ),
    listChannels: resolve.bind(connection,
      'ListChannels',
      (_) => ({}),
      ({ channels }) => channels.map((channel) => ({
        active: channel.active,
        publicKey: channel.remote_pubkey,
        channelPoint: channel.channel_point,
        id: channel.chan_id,
        capacity: channel.capacity,
        localBalance: channel.local_balance,
        remoteBalance: channel.remote_balance,
        commitFee: channel.commit_fee,
        commitWeight: channel.commit_weight,
        feePerKw: channel.fee_per_kw,
        unsettledBalance: channel.unsettled_balance,
        totalSatoshisSent: channel.total_satoshis_sent,
        totalSatoshisReceived: channel.total_satoshis_received,
        numUpdates: channel.num_updates,
        pendingHtlcs: channel.pending_htlcs
      }))
    ),
    listInvoices: resolve.bind(connection,
      'ListInvoices',
      ({ pendingOnly }) => ({ pending: pendingOnly }),
      ({ invoices }) => invoices.map((invoice) => ({
        memo: invoice.memo,
        receipt: invoice.receipt, 
        preimage: invoice.r_preimage.toString('hex'),
        preimageHash: invoice.r_hash.toString('hex'), 
        amount: invoice.value, 
        isSettled: invoice.settled,
        createdOn: parseInt(invoice.creation_date, 10) ?
          new Date(parseInt(invoice.creation_date, 10) * 1e3) : undefined,
        settledOn: parseInt(invoice.settle_date, 10) ?
          new Date(parseInt(invoice.settle_date, 10) * 1e3) : undefined,
        paymentRequest: invoice.payment_request
      }))
    ),
    lookupInvoice: resolve.bind(connection,
      'LookupInvoice',
      ({ preimageHash }) => ({ r_hash_str: preimageHash }),
      ({
        memo,
        receipt, 
        r_preimage,
        r_hash, 
        value, 
        settled,
        creation_date,
        settle_date,
        payment_request
      }) => ({
        memo,
        receipt, 
        preimage: r_preimage.toString('hex'),
        preimageHash: r_hash.toString('hex'), 
        amount: value, 
        isSettled: settled,
        createdOn: parseInt(creation_date, 10) ?
          new Date(parseInt(creation_date, 10) * 1e3) : undefined,
        settledOn: parseInt(settle_date, 10) ?
          new Date(parseInt(settle_date, 10) * 1e3) : undefined,
        paymentRequest: payment_request
      })
    ),
    decodePaymentRequest: resolve.bind(connection,
      'DecodePayReq',
      ({ paymentRequest }) => ({ pay_req: paymentRequest }),
      ({
        destination,
        payment_hash,
        num_satoshis,
        timestamp,
        expiry,
        description
      }) => ({
        destination,
        paymentHash: payment_hash,
        amount: num_satoshis,
        createdOn: parseInt(timestamp, 10) ?
          new Date(parseInt(timestamp, 10) * 1e3) : undefined,
        expiresOn: parseInt(expiry, 10) ?
          new Date(parseInt(expiry, 10) * 1e3) : undefined,
        memo: description
      })
    ),
    listPayments: resolve.bind(connection,
      'ListPayments',
      (_) => ({}),
      ({ payments }) => payments.map((payment) => ({
        paymentHash: payment.payment_hash,
        amount: payment.value,
        createdOn: parseInt(payment.creation_date, 10) ? 
          new Date(parseInt(payment.creation_date, 10) * 1e3) : undefined,
        path: payment.path,
        totalFees: payment.fee
      }))
    ),
    describeGraph: resolve.bind(connection,
      'DescribeGraph',
      (_) => ({}),
      ({ nodes, edges }) => ({
        nodes: nodes.map((node) => ({
          updatedOn: parseInt(node.last_update, 10) ? 
            new Date(parseInt(node.last_update, 10) * 1e3) : undefined, 
          publicKey: node.pub_key,
          alias: node.alias,
          addresses: node.addresses
        })),
        edges: edges.map((edge) => ({
          id: edge.channel_id,
          channelPoint: edge.chan_point,
          updatedOn: parseInt(edge.last_update, 10) ? 
            new Date(parseInt(edge.last_update, 10) * 1e3) : undefined,
          publicKeys: {
            a: edge.node1_pub,
            b: edge.node2_pub
          },
          capacity: edge.capacity,
          policies: {
            a: edge.node1_policy ? ({
              timeLockDelta: edge.node1_policy.time_lock_delta,
              minHtlc: edge.node1_policy.min_htlc,
              feeBaseMsat: edge.node1_policy.fee_base_msat,
              feeRateMsat: edge.node1_policy.fee_rate_milli_msat
            }) : undefined,
            b: edge.node2_policy ? ({
              timeLockDelta: edge.node2_policy.time_lock_delta,
              minHtlc: edge.node2_policy.min_htlc,
              feeBaseMsat: edge.node2_policy.fee_base_msat,
              feeRateMsat: edge.node2_policy.fee_rate_milli_msat
            }): undefined
          }
        }))
      })
    ),
    getChannelInfo: resolve.bind(connection,
      'GetChanInfo',
      ({ id }) => ({ chan_id: id }),
      ({
        channel_id,
        chan_point,
        last_update,
        node1_pub,
        node2_pub,
        capacity,
        node1_policy,
        node2_policy
      }) => ({
        id: channel_id,
        channelPoint: chan_point,
        updatedOn: parseInt(last_update, 10) ? 
          new Date(parseInt(last_update, 10) * 1e3) : undefined,
        publicKeys: {
          a: node1_pub,
          b: node2_pub
        },
        capacity,
        policies: {
          a: node1_policy ? ({
            timeLockDelta: node1_policy.time_lock_delta,
            minHtlc: node1_policy.min_htlc,
            feeBaseMsat: node1_policy.fee_base_msat,
            feeRateMsat: node1_policy.fee_rate_milli_msat
          }) : undefined,
          b: node2_policy ? ({
            timeLockDelta: node2_policy.time_lock_delta,
            minHtlc: node2_policy.min_htlc,
            feeBaseMsat: node2_policy.fee_base_msat,
            feeRateMsat: node2_policy.fee_rate_milli_msat
          }): undefined
        }
      }) 
    ),
    getNodeInfo: resolve.bind(connection,
      'GetNodeInfo',
      ({ publicKey }) => ({ pub_key: publicKey }),
      ({ node, num_channels, total_capacity }) => ({
        node: {
          updatedOn: parseInt(node.last_update, 10) ? 
            new Date(parseInt(node.last_update, 10) * 1e3) : undefined, 
          publicKey: node.pub_key,
          alias: node.alias,
          addresses: node.addresses
        },
        numChannels: num_channels,
        totalCapacity: total_capacity
      })
    ),
    queryRoutes: resolve.bind(connection,
      'QueryRoutes',
      ({ publicKey, amount }) => ({
        pub_key: publicKey,
        amt: amount
      }),
      ({ routes }) => routes.map((route) => ({
        totalTimeLock: route.total_time_lock,
        totalFees: route.total_fees,
        totalAmount: route.total_amt,
        hops: route.hops
      }))
    ),
    getNetworkInfo: resolve.bind(connection,
      'GetNetworkInfo',
      (_) => ({}),
      ({
        graph_diameter,
        avg_out_degree,
        max_out_degree,
        num_nodes,
        num_channels,
        total_network_capacity,
        avg_channel_size,
        min_channel_size,
        max_channel_size
      }) => ({
        graphDiameter: graph_diameter,
        averageOutDegree: avg_out_degree,
        maxOutDegree: max_out_degree,
        numNodes: num_nodes,
        numChannels: num_channels,
        totalNetworkCapacity: total_network_capacity,
        averageChannelSize: avg_channel_size,
        minChannelSize: min_channel_size,
        maxChannelSize: max_channel_size
      })
    ),
    feeReport: resolve.bind(connection,
      'FeeReport',
      (_) => ({}),
      ({ channel_fees }) => channel_fees.map((channel_fee) => ({
        channelPoint: channel_fee.chan_point,
        feeBaseMsat: channel_fee.base_fee_msat,
        feePerMilli: channel_fee.fee_per_mil,
        feeRateMsat: channel_fee.fee_rate
      }))
    )
  },
  Mutation: {
    sendCoins: resolve.bind(connection,
      'SendCoins',
      ({ address, amount }) => ({
        addr: address, amount
      }),
      ({ txid }) => ({ txHash: txid })
    ),
    sendMany: resolve.bind(connection,
      'SendMany',
      ({ recipients }) => recipients.reduce((input, recipient) => (
        Object.assign(input, { [recipient.address]: recipient.amount })
      ), {}),
      ({ txid }) => ({ txHash: txid })
    ),
    newAddress: resolve.bind(connection,
      'NewAddress', ({ type }) => ({
        type: ({
          p2wkh: 0,
          np2wkh: 1,
          p2pkh: 2
        })[type]
      }), (output) => output
    ),
    newWitnessAddress: resolve.bind(connection,
      'NewWitnessAddress', (_) => ({}), (output) => output
    ),
    signMessage: resolve.bind(connection,
      'SignMessage',
      ({ message }) => ({ msg: message }),
      (output) => output 
    ),
    verifyMessage: resolve.bind(connection,
      'VerifyMessage',
      ({ message, signature }) => ({
        msg: message, signature
      }),
      ({ valid, pubkey }) => ({ valid, publicKey: pubkey })
    ),
    connectPeer: resolve.bind(connection,
      'ConnectPeer',
      ({ peerAddress, persist = false }) => ({
        addr: (([pubkey, host]) => ({
          pubkey, host
        }))(peerAddress.split('@')),
        perm: persist
      }),
      ({ peer_id }) => ({ id: peer_id })
    ),
    disconnectPeer: resolve.bind(connection,
      'DisconnectPeer',
      ({ publicKey }) => ({ pub_key: publicKey }),
      (_) => ({ success: true })
    ),
    sendPaymentSync: resolve.bind(connection,
      'SendPaymentSync',
      ({
        recipientPublicKey,
        amount,
        paymentHash,
        paymentRequest
      }) => ({
        dest_string: recipientPublicKey,
        amt: amount,
        payment_hash_string: paymentHash,
        payment_request: paymentRequest
      }),
      ({ payment_error, payment_preimage, payment_route }) => ({
        paymentError: payment_error,
        paymentPreimage: payment_preimage,
        paymentRoute: {
          totalTimeLock: payment_route.total_time_lock,
          totalFees: payment_route.total_fees,
          totalAmount: payment_route.total_amt,
          hops: payment_route.hops
        }
      })
    ),
    addInvoice: resolve.bind(connection,
      'AddInvoice',
      ({
        memo,
        receipt,
        preimage,
        preimageHash,
        amount,
        isSettled,
        createdOn,
        settledOn,
        paymentRequest
      }) => ({
        memo,
        receipt,
        r_preimage: preimage ? new Buffer(preimage, 'hex') : undefined,
        r_hash: preimageHash ? new Buffer(preimageHash, 'hex') : undefined,
        value: amount,
        settled: isSettled,
        creation_date: createdOn ? 
          ((createdOn.valueOf() / 1000) | 0).toString() : undefined,
        settle_date: settledOn ?
          ((settledOn.valueOf() / 1000) | 0).toString() : undefined,
        payment_request: paymentRequest
      }),
      ({ r_hash, payment_request }) => ({
        hash: r_hash.toString('hex'),
        paymentRequest: payment_request.toString('hex')
      })
    ),
    deleteAllPayments: resolve.bind(connection,
      'DeleteAllPayments',
      (_) => ({}),
      (_) => ({ success: true })
    ),
    stopDaemon: resolve.bind(connection,
      'StopDaemon',
      (_) => ({}),
      (_) => ({ success: true })
    ),
    setAlias: resolve.bind(connection,
      'SetAlias',
      ({ alias }) => ({ alias }),
      (_) => ({ success: true })
    ),
    debugLevel: resolve.bind(connection,
      'DebugLevel',
      ({ show, level }) => ({ show, level_spec: level }),
      ({ sub_sytems }) => ({ subSystems: sub_systems })
    ),
    updateFees: resolve.bind(connection,
      'UpdateFees',
      ({ global, chan_point, base_fee_msat, fee_rate }) => ({
        global,
        channelPoint: {
          fundingTxHash: chan_point.funding_txid_str,
          outputIndex: chan_point.output_index
        },
        feeBaseMsat: base_fee_msat,
        feeRateMsat: fee_rate
      }),
      (_) => ({ success: true })
    )
  },
  Subscription: {
    openChannel: subscribe.call(connection,
      'OpenChannel',
      ({
        targetPeerId,
        nodePublicKey,
        localFundingAmount,
        pushSatoshis
      }) => ({
        target_peer_id: targetPeerId,
        node_pubkey_string: nodePublicKey,
        local_funding_amount: localFundingAmount,
        push_sat: pushSatoshis
      }),
      ({ chan_pending, confirmation, chan_open }) => {
        if (chan_pending) {
          return ({
            channelPending: {
              txHash: chan_pending.txid.toString('hex'),
              outputIndex: chan_pending.output_index
            }
          })
        } else if (confirmation) {
          return ({
            confirmation: {
              blockHash: confirmation.block_sha,
              blockHeight: confirmation.block_height,
              numConfirmationsLeft: confirmation.num_confs_left
            }
          })
        } else if (chan_open) {
          return ({
            channelOpen: {
              channelPoint: {
                fundingTxHash: chan_open.channel_point.funding_txid_str,
                outputIndex: chan_open.channel_point.output_index
              }
            }
          })
        }
      }
    ),
    closeChannel: subscribe.call(connection,
      'CloseChannel',
      ({ channelPoint: { fundingTxHash, outputIndex }, force = false}) => ({
        channel_point: {
          funding_txid_str: fundingTxHash,
          output_index: outputIndex
        },
        force
      }),
      ({ close_pending, confirmation, chan_close }) => {
        if (close_pending) {
          return ({
            closePending: {
              txHash: close_pending.txid.toString('hex'),
              outputIndex: close_pending.output_index
            }
          })
        } else if (confirmation) {
          return ({
            confirmation: {
              blockHash: confirmation.block_sha,
              blockHeight: confirmation.block_height,
              numConfirmationsLeft: confirmation.num_confs_left
            }
          })
        } else if (chan_close) {
          return ({
            channelClose: {
              closingTxHash: chan_close.closing_txid,
              success: chan_close.success
            }
          })
        }
      }
    ),
    sendPayment: subscribe.call(connection,
      'SendPayment',
      ({
        recipientPublicKey,
        amount,
        paymentHash,
        paymentRequest
      }) => ({
        dest_string: recipientPublicKey,
        amt: amount,
        payment_hash_string: paymentHash,
        payment_request: paymentRequest
      }),
      ({ payment_error, payment_preimage, payment_route }) => ({
        paymentError: payment_error,
        paymentPreimage: payment_preimage,
        paymentRoute: {
          totalTimeLock: payment_route.total_time_lock,
          totalFees: payment_route.total_fees,
          totalAmount: payment_route.total_amt,
          hops: payment_route.hops
        }
      })
    ),
    subscribeTransactions: subscribe.call(connection,
      'SubscribeTransactions',
      (_) => ({}),
      ({
        tx_hash,
        amount,
        num_confirmations,
        block_hash,
        block_height,
        time_stamp,
        total_fees
      }) => ({
        txHash: tx_hash,
        amount: amount,
        numConfirmations: num_confirmations,
        blockHash: block_hash,
        blockHeight: block_height,
        createdOn: parseInt(transaction.time_stamp, 10) ?
          new Date(parseInt(transaction.time_stamp, 10) * 1e3) : undefined,
        totalFees: total_fees
      })
    ),
    subscribeInvoices: subscribe.call(connection,
      'SubscribeInvoices',
      (_) => ({}),
      ({
        memo,
        receipt, 
        r_preimage,
        r_hash, 
        value, 
        settled,
        creation_date,
        settle_date,
        payment_request
      }) => ({
        memo,
        receipt, 
        preimage: r_preimage.toString('hex'),
        preimageHash: r_hash.toString('hex'), 
        amount: value, 
        isSettled: settled,
        createdOn: parseInt(creation_date, 10) ?
          new Date(parseInt(creation_date, 10) * 1e3) : undefined,
        settledOn: parseInt(settle_date, 10) ?
          new Date(parseInt(settle_date, 10) * 1e3) : undefined,
        paymentRequest: payment_request
      })
    ),
    subscribeChannelGraph: subscribe.call(connection,
      'SubscribeChannelGraph',
      (_) => ({}),
      ({ node_updates, channel_updates, closed_chans }) => ({
        nodeUpdates: node_updates.map((node) => ({
          addresses: node.addresses,
          publicKey: node.identity_key,
          globalFeatures: node.global_features.toString('hex'),
          alias: node.alias
        })),
        channelUpdates: channel_updates.map((channel) => ({
          id: channel.chan_id,
          channelPoint: {
            fundingTxHash: channel.chan_point.funding_txid_str,
            outputIndex: channel.chan_point.output_index
          },
          capacity: channel.capacity,
          policy: ({
            timeLockDelta: channel.routing_policy.time_lock_delta,
            minHtlc: channel.routing_policy.min_htlc,
            feeBaseMsat: channel.routing_policy.fee_base_msat,
            feeRateMsat: channel.routing_policy.fee_rate_milli_msat
          }),
          advertisingNode: channel.advertising_node,
          connectingNode: channel.connectingNode
        })),
        closedChannels: closed_chans.map((closed) => ({
          id: closed.chan_id,
          capacity: closed.capacity,
          closedHeight: closed.closed_height,
          channelPoint: {
            fundingTxHash: closed.chan_point.funding_txid_str,
            outputIndex: closed.chan_point.output_index
          }
        }))
      })
    )
  },
  DateTime: GraphQLDateTime
})

module.exports = {
  buildResolvers
}
