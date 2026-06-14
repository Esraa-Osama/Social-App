//~ Assignment 21 ~//

import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

export let GenderType = new GraphQLEnumType({
  name: "genderType",
  values: {
    male: { value: "male" },
    female: { value: "female" },
  },
});

export let UserType = new GraphQLObjectType({
  name: "userType",
  fields: {
    _id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    age: { type: GraphQLInt },
    gender: { type: GenderType },
    phone: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
  },
});
