import {IResolvers} from 'graphql-tools'
import Guild from "../../../models/Guild";
import Warn from "../../../models/Warn";

export default {
    disable: async (source, args, context, info) => {
        const guild = (await Guild.findOne({id: source.id}))!
        if (guild.disabledCommands.includes(args.command)) return guild.disabledCommands
        guild.disabledCommands.push(args.command)
        await guild.save()
        return guild.disabledCommands
    },
    enable: async (source, args, context, info) => {
        const guild = (await Guild.findOne({id: source.id}))!
        if (!guild.disabledCommands.includes(args.command)) return guild.disabledCommands
        guild.disabledCommands = guild.disabledCommands.filter(r=>r !== args.command)
        await guild.save()
        return guild.disabledCommands
    },
    disabled: async (source, args, context, info) => {
        const data = await Guild.findOne({id: source.id})
        if (!data) return []
        return data.disabledCommands
    },
    serverListEnabled: async (source, args, context, info) => {
        const data = await Guild.findOne({id: source.id})
        if (!data) return false
        return data.serverListEnabled
    },
    enableServerList: async (source, args, context, info) => {
        const data = await Guild.findOne({id: source.id})
        if (!data) return null
        data.serverListEnabled = true
        await data.save()
        return data.serverListEnabled
    },
    disableServerList: async (source, args, context, info) => {
        const data = await Guild.findOne({id: source.id})
        if (!data) return null
        data.serverListEnabled = false
        await data.save()
        return data.serverListEnabled
    },
    warns: async source => {
        return Warn.find({guild: source.id})
    }
} as IResolvers