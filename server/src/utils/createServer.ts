import fs from "fs";
import jwt from "@fastify/jwt";
import path from "path";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import userRoutes from "../modules/user/user.route";
import vaultRoutes from "../modules/vault/vault.route";
import fastify, { FastifyRequest, FastifyReply } from "fastify";
import { CORS_ORIGIN } from "../constants";

declare module "fastify"{
  export interface FastifyInstance{
    authenticate: any;
  }
}


function createServer() {
  const app = fastify();

  app.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
  });

  app.register(jwt, {
    secret: {
      private: fs.readFileSync(
        `${(path.join(process.cwd()), "certs")}/private.key`,
        "utf8"
      ),
      public: fs.readFileSync(
        `${(path.join(process.cwd()), "certs")}/public.key`,
        "utf8"
      ),
    },
    sign: { algorithm: "RS256" },
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });

  app.register(cookie, {
    parseOptions: {},
  });

  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await request.jwtVerify<{
          _id: string;
        }>();

        request.user = user;
      } catch (error) {
        return reply.send(error);
      }
    }
  );

  app.register(userRoutes, { prefix: "api/users" });
  app.register(vaultRoutes, { prefix: "api/vault" });

  return app;
}

export default createServer;