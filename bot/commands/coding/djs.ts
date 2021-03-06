import {Command} from "discord-akairo";
import {Message, MessageEmbed} from "discord.js";
import fetch from "node-fetch";

export default class Help extends Command {
    constructor() {
        super('search_djs', {
            aliases: ['discordjs', 'djs'],
            description: 'discord.js 검색하는 명령어',
            category: 'coding',
            args: [
                {
                    id: 'input',
                    match: 'rest',
                    default: '',
                }
            ]
        });
    }
    async exec(msg: Message, {input}: {input: string}) {
        if (!input) return msg.util!.send(msg.embed().setFooter('').setDescription('명령어 사용법: djs (검색어)'))
        const d = await (await fetch(`https://djsdocs.sorta.moe/v2/embed?src=https://raw.githubusercontent.com/discordjs/discord.js/docs/stable.json&q=${encodeURIComponent(input)}`)).json()
        await msg.util!.send(new MessageEmbed(d))
    }
}