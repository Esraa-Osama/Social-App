//~ Assignment 21 ~//

import { authorizationGQL } from "./../../../common/middleware/authorization.middleware";
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { APPError } from "../../../common/utils/global-error-handler";
import { GenderType, UserType } from "./auth.type";
import { getUserArgs } from "./auth.args";
import authService from "../auth.service";
import { authenticationGQL } from "../../../common/middleware/authentication.middleware";
import { RoleEnum } from "../../../common/enum/user.enum";
import { validationGQL } from "../../../common/middleware/validation.middleware";
import { getUserSchema } from "../auth.validation";

export class AuthFields {
  constructor() {}
  query = () => {
    return {
      getUser: {
        type: UserType,
        args: { token: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: async (parent: any, args: any, context: any) => {
          await validationGQL(getUserSchema, args);
          const { user, decoded } = await authenticationGQL(args.token);
          await authorizationGQL([RoleEnum.admin, RoleEnum.user], user.role!);
          return authService.getUser(user._id);
        },
      },
      listUsers: {
        type: new GraphQLList(UserType),
        resolve: async (parent: any, args: any, context: any) => {
          return authService.listUsers();
        },
      },
    };
  };
}

export default new AuthFields();
