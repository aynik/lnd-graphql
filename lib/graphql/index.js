const { makeExecutableSchema } = require('graphql-tools')
const { getConnection } = require('../grpc')

const { schema } = require('./schema')
const { buildResolvers } = require('./resolvers')

const getGraphQLExecutableSchema = (grpcConfig = {}) => (
  getConnection(grpcConfig).then((connection) => (
    getGraphQLExecutableSchemaWithConnection(connection)
  ))
)

const getGraphQLConfig = (grpcConfig = {}) => (
  getConnection(grpcConfig).then((connection) => (
    getGraphQLConfigWithConnection(connection)
  ))
)

const getGraphQLExecutableSchemaWithConnection = (connection) => {
  return ({
    schema: makeExecutableSchema({
      typeDefs: [schema],
      resolvers: buildResolvers(connection)
    }),
    context: {}
  })
}

const getGraphQLConfigWithConnection = (connection) => {
  return ({
    typeDefs: schema,
    resolvers: buildResolvers(connection)
  })
}

module.exports = { 
  getGraphQLExecutableSchema,
  getGraphQLConfig,
  getGraphQLExecutableSchemaWithConnection,
  getGraphQLConfigWithConnection
}
