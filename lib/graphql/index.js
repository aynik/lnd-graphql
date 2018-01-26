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
  const resolvers = buildResolvers(connection)
  return ({
    schema: makeExecutableSchema({
      typeDefs: [schema],
      resolvers
    }),
    context: {
      ...resolvers
    }
  })
}

const getGraphQLConfigWithConnection = (connection) => {
  const resolvers = buildResolvers(connection)
  return ({
    typeDefs: schema,
    resolvers,
    context: {
      ...resolvers
    }
  })
}

module.exports = {
  getGraphQLExecutableSchema,
  getGraphQLConfig,
  getGraphQLExecutableSchemaWithConnection,
  getGraphQLConfigWithConnection
}
