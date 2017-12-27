const { makeExecutableSchema } = require('graphql-tools')
const { getConnection } = require('../grpc')

const { schema } = require('./schema')
const { buildResolvers } = require('./resolvers')

const getGraphQLConfig = (grpcConfig = {}) => (
  getConnection(grpcConfig).then((connection) => (
    getGraphQLConfigWithConnection(connection)
  ))
)

const getGraphQLConfigWithConnection = (connection) => {
  return ({
    schema: makeExecutableSchema({
      typeDefs: [schema],
      resolvers: buildResolvers(connection)
    }),
    context: {}
  })
}

module.exports = { 
  getGraphQLConfig,
  getGraphQLConfigWithConnection
}
