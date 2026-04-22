import { Context } from "hono";

export type AppContext = {
  Variables: {
    requestId: string;
    userId: string;
  };
};

export type AppEnv = Context<AppContext>;
