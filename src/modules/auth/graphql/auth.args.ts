import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { GenderType } from "./auth.type";

export const getUserArgs = {
  name: { type: new GraphQLNonNull(GraphQLString) },
};
