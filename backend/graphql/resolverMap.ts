import {IResolvers} from 'graphql-tools'
import request from "../util/request";
import fetch, {Response} from 'node-fetch'
import config from '../../config.json'
import jwt from 'jsonwebtoken'

const req = (...data: [
    RequestInfo,
    RequestInit?
]) : Promise<Response> => new Promise(async resolve => {
    // @ts-ignore
    await fetch(...data).then(async result => {
        if (result.status === 429) {
            const json = await result.json()
            return resolve(new Promise(r2=>setTimeout(r2, json.retry_after)).then(() => req(...data)))
        }
        return resolve(result)
    })
})

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
            context.user.guilds = await (await req('https://discord.com/api/users/@me/guilds', {
                headers: {
                    Authorization: `Bearer ${context.user.accessToken}`
                }
            })).json()

            return {
                user: context.user.user
            }
        },
        guild: async (source, args, context) => {
            if (!context.user) return null
            const guilds = await (await req('https://discord.com/api/users/@me/guilds', {
                headers: {
                    Authorization: `Bearer ${args.user.accessToken}`
                }
            })).json()
            if (!guilds.find((r: any)=>r.id === args.id) || ((context.user.guilds.find((r: any)=>r.id === args.id).permissions & 8) === 0)) {
                return null
            }
            args.id.replace('"', '\\"')
            const data = (await Promise.all(Object.values(global.namespaces.bot!.sockets).map(socket => request(socket, 'guild', {
                id: args.id
            })))).find(r=>r) || null
            if (data) {
                data.members = data.members.length
                data.roles = data.roles.length
                data.channels = data.channels.length
            }
            return data
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
            result.accessToken = json.access_token
            return jwt.sign(result, config.web.jwt)
        }
    },
    SelfUser: {
        guilds: async (source, args, ctx) => {
            const guilds = ctx.user.guilds

            const fetched0 = ((await Promise.all(Object.values(global.namespaces.bot!.sockets).map(socket => request(socket, 'guilds', {
                guilds: guilds.map((r: any)=>r.id)
            })))) || [])

            let fetched: any[] = []

            for (const i of fetched0) {
                fetched = [...fetched, ...i]
            }

            return guilds instanceof Array ? (guilds.map((guild: any) => {
                const g = fetched.find((r: any)=>r?.id === guild.id)

                const value = g ? g : null

                if (value) {
                    guild.members = value.members.length
                }

                guild.bot = Boolean(value)

                return guild
            })).filter((guild: any) => {
                switch (args.type) {
                    case 'ADMIN':
                        return Boolean(Number(guild.permissions) & 8)
                    case 'USER':
                    default:
                        return true
                }
            }) : []
        }
    }
} as IResolvers