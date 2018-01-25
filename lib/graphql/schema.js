const { buildSchema } = require('graphql')

const schema = ` 
  # DateTime scalar
  scalar DateTime

  # Address types enum 
  enum AddressType {
    # Pay to witness key hash
    p2wkh,
    # Pay to nested witness key hash
    np2wkh,
    # Pay to public key hash
    p2pkh
  } 

  # A balance type 
  type Balance {
    # The balance amount denominated in satoshis
    balance: Int
  }

  # An on-chain transaction
  type Transaction {
    # The transaction hash
    txHash: String,
    # The transaction ammount denominated in satoshis
    amount: Int,
    # The number of confirmations
    numConfirmations: Int,
    # The hash of the block this transaction was included in
    blockHash: String,
    # The height of the block this transaction was included in
    blockHeight: Int,
    # Timestamp of this transaction
    createdOn: DateTime,
    # Fees paid for this transaction
    totalFees: Int
  }

  # A connected peer type
  type Peer {
    # The peer identifier from the local point of view
    id: Int,
    # The identity pubkey of the peer
    publicKey: String,
    # Network address of the peer
    address: String,
    # Bytes of data transmitted to this peer
    bytesSent: Int,
    # Bytes of data transmitted from this peer
    bytesReceived: Int,
    # Satoshis sent to this peer
    amountSent: Int,
    # Satoshis received from this peer
    amountReceived: Int,
    # Ping time to this peer
    pingTime: Int
    # Whether the peer initiated the connection
    isInbound: Boolean,
  }

  # A basic ok type to use in place of empty responses
  type OkResult {
    # Whether the operation succeded or not
    success: Boolean
  }

  # A debug level result type 
  type DebugLevelResult {
    subSystems: String
  }

  # A send coins result type
  type SendCoinsResult {
    # The resulting transaction hash
    txHash: String
  }

  # An new address result type
  type NewAddressResult {
    # The address encoded as a string
    address: String
  }

  # A sign message result type 
  type SignMessageResult {
    # The signature for a given message
    signature: String
  }

  # A verify message result type 
  type VerifyMessageResult {
    # Whether the verification was successful or not
    valid: Boolean,
    # The public key recovered from the signature
    publicKey: String
  }

  # A connect peer result type
  type ConnectPeerResult {
    # The peer identifier from the local point of view
    id: Int
  } 

  # A general information type
  type Info {
    # The identity pubkey of the current node
    publicKey: String, 
    # If applicable, the alias of the node
    alias: String, 
    # Number of pending channels
    pendingChannels: Int,
    # Number of active channels
    activeChannels: Int,
    # Number of connected peers
    connectedPeers: Int,
    # The height of the best block
    blockHeight: Int,
    # The hash of the best block
    blockHash: String, 
    # A list of active chains the node is connected to
    chains: [String], 
    # Whether the wallet is fully synchronized to the current chain
    isSynchronized: Boolean,
    # Whether the current node is connected to testnet
    isTestnet: Boolean
  }

  # A pending channels information type
  type PendingChannelsInfo {
    # The balance in satoshis encumbered in pending channels
    amountInLimbo: Int,
    # Channels pending opening
    pendingOpen: [PendingOpenChannel],
    # Channels pending closing
    pendingClose: [PendingCloseChannel],
    # Channels pending force closing
    pendingForceClose: [PendingForceCloseChannel]
  }

  # A pending open channel type
  type PendingOpenChannel {
    # The height at which this channel will be confirmed
    confirmationHeight: Int,
    # The number of blocks until this channel is open
    blocksUntilOpen: Int,
    # The amount calculated to be paid in fees for 
    # the current set of commitment transactions
    commitFee: Int,
    # The weight of the commitment transaction
    commitWeight: Int,
    # The required number of satoshis per kilo-weight
    # that the requester will pay at all times
    feePerKw: Int
  }

  # A pending close channel type
  type PendingCloseChannel {
    # The transaction id of the closing transaction
    closingTxHash: String
  }

  # A pending force close channel type
  type PendingForceCloseChannel {
    # The transaction id of the closing transaction
    closingTxHash: String,
    # The balance in satoshis encumbered in this pending channel
    amountInLimbo: Int,
    # The height at which funds can be sweeped into the wallet
    maturityHeight: Int,
    # Remaining number of blocks until funds can be
    # sweeped into the wallet
    blocksUntilMaturity: Int
  }

  # An active channel type
  type Channel {
    # Whether this channel is active or not
    active: Boolean,
    # The identity pubkey of the remote node
    remotePublicKey: String,
    # The outpoint (txid:index) of the funding transaction 
    channelPoint: String,
    # The unique channel ID for the channel
    id: String,
    # The total amount of funds held in this channel
    capacity: Int,
    # This node’s current balance in this channel
    localBalance: Int,
    # The counterparty’s current balance in this channel
    remoteBalance: Int,
    # The amount calculated to be paid in fees for 
    # the current set of commitment transactions
    commitFee: Int,
    # The weight of the commitment transaction
    commitWeight: Int,
    # The required number of satoshis per kilo-weight that 
    # the requester will pay at all times, for both the 
    # funding transaction and commitment transaction
    feePerKw: Int,
    # The unsettled balance in this channel
    unsettledBalance: Int,
    # The total number of satoshis we’ve sent within this channel
    totalSatoshisSent: Int,
    # The total number of satoshis we’ve received within this channel
    totalSatoshisReceived: Int,
    # The total number of updates conducted within this channel
    numUpdates: Int,
    # The list of active, uncleared HTLCs currently pending within the channel
    pendingHtlcs: [String]
  }

  # An open channel action status update type
  type OpenChannelStatusUpdate {
    channelPending: ChannelPendingUpdate,
    confirmation: ConfirmationUpdate,
    channelOpen: ChannelOpenUpdate
  }

  # An close channel action status update type
  type CloseChannelStatusUpdate {
    closePending: ChannelPendingUpdate,
    confirmation: ConfirmationUpdate,
    channelClose: ChannelCloseUpdate
  }

  # A channel pending update type
  type ChannelPendingUpdate {
    txHash: String,
    outputIndex: Int
  }

  # A confirmation update type
  type ConfirmationUpdate {
    blockHash: String,
    blockHeight: String,
    numConfirmationsLeft: Int
  }

  # A channel open operation update type
  type ChannelOpenUpdate {
    channelPoint: ChannelPoint
  }

  # A channel close operation update type
  type ChannelCloseUpdate {
    closingTxHash: String,
    success: Boolean
  }

  # A graph topology update type
  type GraphTopologyUpdate {
    nodeUpdates: [NodeUpdate], 
    channelUpdates: [ChannelEdgeUpdate],
    closedChannels: [ClosedChannelUpdate]
  }

  # A node update type
  type NodeUpdate {
    addresses: [String],
    publicKey: String,
    globalFeatures: String,
    alias: String
  }

  # A channel edge update type
  type ChannelEdgeUpdate {
    # The unique channel ID for the channel
    id: String,
    channelPoint: ChannelPoint,
    capacity: Int,
    policy: RoutingPolicy,
    advertisingNode: String,
    connectingNode: String
  }

  # A closed channel update
  type ClosedChannelUpdate {
    # The unique channel ID for the channel
    id: String,
    capacity: Int,
    closedHeight: Int,
    channelPoint: ChannelPoint
  }

  # A channel point type
  type ChannelPoint {
    # Tx hash of the funding transaction
    fundingTxHash: String,
    # The index of the output of the funding transaction
    outputIndex: Int
  }

  # A payment status update type
  type PaymentStatusUpdate {
    paymentError: String,
    paymentPreimage: String,
    paymentRoute: Route
  }

  # A paymnent type
  type Payment {
    # The payment hash
    paymentHash: String,
    # The value of the payment in satoshis
    amount: Int,
    # The date of this payment
    createdOn: DateTime,
    # The path this payment took
    path: [String],
    # The fee paid for this payment in satoshis
    totalFees: Int
  }

  # A route type
  type Route {
    # The cumulative (final) time lock across the entire route
    totalTimeLock: Int,
    # The sum of the fees paid at each hop within the final route 
    totalFees: Int,
    # The total amount of funds required to complete a payment over this route
    totalAmount: Int, 
    # Contains details concerning the specific forwarding details at each hop
    hops: [String]
  }

  # A channel graph type
  type ChannelGraph {
    # The list of LightningNodes in this channel graph
    nodes: [LightningNode],
    # The list of ChannelEdges in this channel graph
    edges: [ChannelEdge]
  }

  # A lightning node type
  type LightningNode {
    updatedOn: DateTime,
    publicKey: String,
    alias: String,
    addresses: [String]
  }

  # A node information type
  type NodeInfo {
    # An individual vertex/node within the channel graph
    node: LightningNode,
    numChannels: Int,
    totalCapacity: Int
  }

  # A network information type
  type NetworkInfo {
    graphDiameter: Int,
    averageOutDegree: Int,
    maxOutDegree: Int,
    numNodes: Int,
    numChannels: Int,
    totalNetworkCapacity: Int,
    averageChannelSize: Int,
    minChannelSize: Int,
    maxChannelSize: Int
  }

  # A channel fee report type
  type ChannelFeeReport {
    # The channel that this fee report belongs to
    channelPoint: String,
    # The base fee charged regardless of the number of milli-satoshis sent
    feeBaseMsat: Int,
    # The amount charged per milli-satoshis transferred 
    # expressed in millionths of a satoshi
    feePerMilli: Int,
    # The effective fee rate in milli-satoshis. 
    # Computed by dividing the fee_per_mil value by 1 million
    feeRateMsat: Int
  }

  # A channel edge type
  type ChannelEdge {
    # The unique channel ID for the channel. The first 3 bytes 
    # are the block height, the next 3 the index within the block, 
    # and the last 2 bytes are the output index for the channel.
    id: String,
    channelPoint: ChannelPoint,
    updatedOn: DateTime,
    publicKeys: PublicKeyEdge,
    capacity: Int,
    policies: RoutingPolicyEdge
  }

  # A public key edge type
  type PublicKeyEdge {
    a: String,
    b: String
  }

  # A policy edge type
  type RoutingPolicyEdge {
    a: RoutingPolicy,
    b: RoutingPolicy
  }

  # A routing policy type
  type RoutingPolicy {
    timeLockDelta: Int,
    minHtlc: Int,
    feeBaseMsat: Int,
    feeRateMsat: Int
  }

  # An added invoice result type
  type AddInvoiceResult {
    hash: String, 
    # A bare-bones invoice for a payment within the Lightning Network
    paymentRequest: String
  }

  # An invoice type
  type Invoice {
    # An optional memo to attach along with the invoice
    memo: String,
    # An optional cryptographic receipt of payment
    receipt: String, 
    # The preimage  which will allow settling an 
    # incoming HTLC payable to this preimage
    preimage: String,
    # The hash of the preimage
    preimageHash: String, 
    # The amount value of this invoice in satoshis
    amount: Int, 
    # Whether this invoice has been fulfilled
    isSettled: Boolean,
    # When this invoice was created
    createdOn: DateTime,
    # When this invoice was settled
    settledOn: DateTime,
    # A bare-bones invoice for a payment within the Lightning Network
    paymentRequest: String
  }

  # A decoded pay req type
  type DecodedPaymentRequest {
    destination: String,
    paymentHash: String,
    amount: Int
  } 

  # An invoice params input
  input InvoiceParams {
    # An optional memo to attach along with the invoice
    memo: String,
    # An optional cryptographic receipt of payment
    receipt: String, 
    # The preimage  which will allow settling an 
    # incoming HTLC payable to this preimage
    preimage: String,
    # The hash of the preimage
    preimageHash: String, 
    # The amount value of this invoice in satoshis
    amount: Int, 
    # Whether this invoice has been fulfilled
    isSettled: Boolean,
    # When this invoice was created
    createdOn: DateTime,
    # When this invoice was settled
    settledOn: DateTime,
    # A bare-bones invoice for a payment within the Lightning Network
    paymentRequest: String
  }

  # An output recipient input
  input Recipient { 
    # The recipient address
    address: String!,
    # The reciving amount denominated in satoshis
    amount: Int!
  }

  # A channel point input
  input OpenChannelPoint {
    # Tx hash of the funding transaction
    fundingTxHash: String,
    # The index of the output of the funding transaction
    outputIndex: Int
  }

  type Query {
    # Returns the sum of all confirmed unspent outputs 
    # under control by the wallet denominated in satoshis
    getWalletBalance(
      # Wether only witness outputs should be considered 
      # when calculating the wallet’s balance
      witnessOnly: Boolean
    ): Balance,
    # Returns the total funds available across all 
    # open channels denominated in satoshis
    getChannelBalance: Balance,
    # Returns a list describing all the known 
    # transactions relevant to the wallet
    getTransactions: [Transaction],
    # Returns a verbose listing of all currently connected peers
    listPeers: [Peer],
    # Returns general information concerning the lightning node
    getInfo: Info,
    # Returns a list of all the channels that are pending 
    pendingChannels: PendingChannelsInfo,
    # Returns a description of all the open channels
    # that this node is a participant in
    listChannels: [Channel],
    # Returns a list of all the invoices currently
    # stored within the database
    listInvoices(
      # Wether all invoices should be returned, 
      # or only those that are currently unsettled
      pendingOnly: Boolean
    ): [Invoice],
    # Attemps to look up an invoice according to its payment hash
    lookupInvoice(
      # The payment hash of the invoice to be looked up
      preimageHash: String
    ): Invoice,
    # Takes an encoded payment request string and attempts
    # to decode it, returning a full description of the
    # conditions encoded within the payment request
    decodePaymentRequest(
      # The payment request string to be decoded
      paymentRequest: String
    ): DecodedPaymentRequest,
    # Returns a list of all outgoing payments
    listPayments: [Payment],
    # Returns a description of the latest graph state
    # from the point of view of the node
    describeGraph: ChannelGraph,
    # Returns the latest authenticated network announcement
    # for the given channel identified by its channel ID
    getChannelInfo(
      # The unique channel ID for the channel. The first 3 bytes 
      # are the block height, the next 3 the index within the block,
      # and the last 2 bytes are the output index for the channel
      id: String
    ): ChannelEdge,
    # Returns the latest advertised, aggregated, and authenticated 
    # channel information for the specified node identified by its public key
    getNodeInfo(
      # The compressed public key of the target node
      publicKey: String
    ): NodeInfo,
    # Attempts to query the daemon’s Channel Router for 
    # a possible route to a target destination capable 
    # of carrying a specific amount of satoshis
    queryRoutes(
      # The public key for the payment destinati
      publicKey: String,
      # The amount to send expressed in satoshis
      amount: Int
    ): [Route],
    # Returns some basic stats about the known channel 
    # graph from the point of view of the node
    getNetworkInfo: NetworkInfo,
    # Allows the caller to obtain a report detailing the current
    # fee schedule enforced by the node globally for each channe
    feeReport: [ChannelFeeReport]
  }

  type Mutation {
    # Executes a request to send coins to a particular address
    sendCoins(recipient: Recipient): SendCoinsResult,
    # Executes a request for a transaction that 
    # creates multiple specified outputs in parallel
    sendMany(recipients: [Recipient]): SendCoinsResult,
    # Creates a new address under control of the local wallet
    newAddress(
      # The address type
      type: AddressType!
    ): NewAddressResult,
    # Creates a new witness address under control of the local wallet
    newWitnessAddress: NewAddressResult,
    # Signs a message with this node’s private key
    signMessage(
      # The message to be signed
      message: String!
    ): SignMessageResult, 
    # Verifies a signature over a message
    verifyMessage(
      # The message body
      message: String,
      # The signature for the message
      signature: String
    ): VerifyMessageResult,
    # Attempts to establish a connection to a remote peer
    connectPeer(
      # Lightning address of the peer, in the format <pubkey>@host
      peerAddress: String,
      # Wether the daemon will attempt to persistently 
      # connect to the target peer
      persist: Boolean
    ): ConnectPeerResult,
    # Attempts to disconnect one peer identified by a given pubKey
    disconnectPeer(
      # The public key of the node to disconnect from
      publicKey: String!
    ): OkResult,
    # Sends payments through the Lightning Network and
    # blocks the result until either error or success
    sendPaymentSync(
      # The identity pubkey of the payment recipient
      recipientPublicKey: String,
      # Amount of satoshis to send
      amount: Int,
      # The hash to use within the payment’s HTLC
      paymentHash: String,
      # A bare-bones invoice for a payment within the Lightning Network
      paymentRequest: String
    ): PaymentStatusUpdate,
    # Attempts to add a new invoice to the invoice database
    addInvoice(params: InvoiceParams): AddInvoiceResult,
    # Deletes all outgoing payments from DB
    deleteAllPayments: OkResult
    # Will send a shutdown request to the interrupt handler,
    # triggering a graceful shutdown of the daemon.
    stopDaemon: OkResult,
    # Sets the alias for this node
    setAlias(
      alias: String
    ): OkResult,
    # Allows a caller to programmatically set the 
    # logging verbosity of lnd 
    debugLevel(
      show: Boolean,
      level: String
    ): DebugLevelResult,
    updateFees(
      # Whether this fee update applies to all currently active channels
      global: Boolean,
      # Target for an specific channel
      channelPoint: OpenChannelPoint,
      # The base fee charged regardless of the number of milli-satoshis sent
      feeBaseMsat: Int,
      # The effective fee rate in milli-satoshis
      feeRateMsat: Int
    ): OkResult
  }

  type Subscription {
    # Attempts to open a singly funded channel specified
    # in the request to a remote peer
    openChannel(
      # The peer id of the node to open a channel with
      targetPeerId: Int,
      # The public key of the node to open a channel with
      nodePublicKey: String,
      # The number of satoshis the wallet should commit to the channel
      localFundingAmount: Int,
      # The number of satoshis to push to the remote side
      # as part of the initial commitment state
      pushSatoshis: Int
    ): OpenChannelStatusUpdate,
    # Attempts to close an active channel identified
    # by its channel outpoint
    closeChannel(
      # The outpoint (txid:index) of the funding transaction
      channelPoint: OpenChannelPoint,
      # Wether the channel will be closed forcibly
      force: Boolean
    ): CloseChannelStatusUpdate,
    # Dispatches a bi-directional streaming RPC for
    # sending payments through the Lightning Network
    sendPayment(
      # The identity pubkey of the payment recipient
      recipientPublicKey: String,
      # Amount of satoshis to send
      amount: Int,
      # The hash to use within the payment’s HTLC
      paymentHash: String,
      # A bare-bones invoice for a payment within the Lightning Network
      paymentRequest: String
    ): PaymentStatusUpdate,
    # Creates a uni-directional stream from the server to 
    # the client in which any newly discovered transactions
    # relevant to the wallet are sent over
    subscribeTransactions: Transaction
    # Returns a uni-directional stream (sever -> client) 
    # for notifying the client of newly added/settled invoices
    subscribeInvoices: Invoice,
    # Launches a streaming RPC that allows the caller to 
    # receive notifications upon any changes to the channel graph 
    # topology from the point of view of the responding node
    subscribeChannelGraph: GraphTopologyUpdate
  }

  schema {
    query: Query
    mutation: Mutation,
    subscription: Subscription
  }
`

module.exports = {
  schema
}
