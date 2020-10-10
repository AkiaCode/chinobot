import {IResolvers} from 'graphql-tools'
import request from "../util/request";
import fetch from 'node-fetch'
import config from '../../config.json'
import jwt from 'jsonwebtoken'

export default {
    Query: {
        status: async () => {
            const sockets = Object.values(global.namespaces.bot!.sockets)
            const shards: any[] = []
            for (let socket of sockets) {
                (await request(socket,'shards')).forEach((i:any)=>shards.push(i))
            }
            return {shards}
        },
        me: async (source, args, context) => {
            if (!context.user) return null
            return {
                user: context.user.user,
                guilds: context.user.guilds instanceof Array ? context.user.guilds : [] || []
            }
        }
    },
    Mutation: {
        login: async (source, {code}) => {
            const data = {
                client_id: config.web.oauth2.clientID,
                client_secret: config.web.oauth2.clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: config.web.oauth2.callback,
                code: code,
                scope: 'identify guilds',
            };
            const res = (await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams(data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }))
            const json = await res.json()
            if (res.status !== 200) {
                return null
            }
            const result: any = {}
            result.user = await (await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `${json.token_type} ${json.access_token}`
                }
            })).json()
            result.user.tag = result.user.username + '#' + result.user.discriminator
            result.guilds = await (await fetch('https://discord.com/api/users/@me/guilds', {
                headers: {
                    Authorization: `${json.token_type} ${json.access_token}`
                }
            })).json()
            return jwt.sign(result, config.web.jwt)
        }
    }
} as IResolvers
