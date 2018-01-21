const { GraphQLServer } = require('graphql-yoga')
const { getGraphQLConfig } = require('../../')

const PORT = process.env.PORT || 3000

const options = {
  port: PORT,
  endpoint: '/graphql',
  subscriptions: '/graphql',
  playground: '/playground',
}

getGraphQLConfig().then((config) => {
  const server = new GraphQLServer(config)
  server.start(options, () => {
    console.log(`graphql: http://localhost:${PORT}/graphql`)
    console.log(`subscriptions: ws://localhost:${PORT}/graphql`)
    console.log(`playground: http://localhost:${PORT}/playground`)
  })
})
