//~ Assignment 20 ~//

import { GraphQLObjectType, GraphQLSchema } from "graphql";
import authFields from "../auth/graphql/auth.fields";

export const graphQLSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "query",
    description: "query",
    fields: { ...authFields.query() },
  }),
});
