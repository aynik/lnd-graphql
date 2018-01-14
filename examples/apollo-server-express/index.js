const url = require('url')
const express = require('express')
const bodyParser = require('body-parser')
const { createServer } = require('http')
const { execute, subscribe } = require('graphql')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const { SubscriptionServer } = require('subscriptions-transport-ws')

const { getGraphQLExecutableSchema } = require('../../')

const PORT = process.env.PORT || 3000

const app = express()

const server = createServer(app)

getGraphQLExecutableSchema().then((config) => {
  app.use('/graphql', bodyParser.json(), graphqlExpress(config))
  app.get('/graphiql', graphiqlExpress((req) => ({
    endpointURL: '/graphql',
    subscriptionsEndpoint: url.format({
      host: req.get('host'),
      protocol: req.protocol === 'https' ? 'wss' : 'ws',
      pathname: '/subscriptions'
    })
  })))

  const { schema } = config
  const subscriptions = new SubscriptionServer(
    { schema, execute, subscribe },
    { server, path: '/subscriptions' })

  server.listen(PORT, () => {
    console.log(`graphql: http://localhost:${PORT}/graphql`)
    console.log(`graphiql: http://localhost:${PORT}/graphiql`)
    console.log(`subscriptions: http://localhost:${PORT}/subscriptions`)
  })
}).catch((err) => console.log(err))
