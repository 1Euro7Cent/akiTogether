const { Client, MessageEmbed } = require('discord.js')
const { Aki, regions } = require('aki-api');

const { token, prefix, maxPercent, defaultLanguage, waitTime, emojis } = require('./config.json')

const bot = new Client()
var akis = {}

String.prototype.replaceAll = function (whatreplace, replacewith) {
    let output = this
    while (output.includes(whatreplace)) {
        output = output.replace(whatreplace, replacewith)
    }
    return output;
}

bot.on('ready', () => {
    function clock() {
        var c = 0
        console.log('clock triggers')
        for (let i in akis) {
            ch = akis[i].m.channel
            ch.startTyping()
            c++
        }
        if (c > 0) {
            bot.user.setPresence({ activity: { name: `${c} akinator sessions | ${prefix}help`, type: 'PLAYING' }, status: 'online' })
        }
        else {
            bot.user.setPresence({ activity: { name: `${c} akinator sessions | ${prefix}help`, type: 'PLAYING' }, status: 'idle' })
        }
        trigger(akis)
        setTimeout(() => {
            clock()
        }, waitTime);
    }
    clock()

    console.log(`Bot logged in as ${bot.user.tag}`)
})
bot.on('message', async (message) => {
    if (message.author.bot) return
    var chID = message.channel.id
    var [cmd, ...args] = message.content
        .toLowerCase()
        .trim()
        .substring(prefix.length)
        .split(/\s/);

    if (message.content.startsWith(prefix)) {

        switch (cmd) {
            case 'help':
                message.channel.send(new MessageEmbed()
                    .setTitle('Help')
                    .setDescription(`[Invite me](https://discord.com/oauth2/authorize?client_id=${bot.user.id}&permissions=92224&scope=bot)
**Available commands**
<> = required; [] = optional

\`${prefix}list\` Get a list on available language codes
\`${prefix}start [language code (default en)]\` This starts a new round in this channel
\`${prefix}stop\` This stops a running round
\`${prefix}help\` This thing
                `)
                )
                break
            case 'list':
                var mes = ''
                for (let i of regions) {
                    mes = mes + `${i}\n`
                }
                message.channel.send(mes)
                break
            case 'start':
                var lang
                if (typeof args[0] === 'undefined') lang = defaultLanguage
                else {
                    if (!regions.includes(args[0])) return message.channel.send(new MessageEmbed()
                        .setTitle('ERROR')
                        .setDescription(`\`${args[0]}\` is not a valid language`)
                    )
                    lang = args[0]
                }

                if (available(chID, akis)) {//check if in this channel is already an round
                    message.channel.startTyping()
                    akis[chID] = new Aki(lang)
                    await akis[chID].start()
                    var akimsg = sendAki(akis, chID)


                    await message.channel.send(new MessageEmbed()
                        .setTitle(akimsg[1])
                        .setDescription(akimsg[0])
                    ).then(m => {
                        akis[chID].m = m
                        akis[chID].users = []
                        akis[chID].creator = message.author.id

                        akis[chID].c = {
                            "0": 0,
                            "1": 0,
                            "2": 0,
                            "3": 0,
                            "4": 0,
                            "r": 0
                        }
                        m.react(emojis.yes)
                        m.react(emojis.no)
                        m.react(emojis.idk)
                        m.react(emojis.maybe)
                        m.react(emojis.maybeNot)
                        m.react(emojis.reverse)
                    })
                    message.channel.stopTyping()

                }
                else {
                    message.channel.send(new MessageEmbed()
                        .setTitle('ERROR')
                        .setColor(0xff0000)
                        .setDescription('There is already a game running in this channel')

                    )
                }
                break
            case 'stop':
                if (akis[chID].creator == message.author.id) {
                    stop(akis, chID)
                }
                else return message.channel.send(new MessageEmbed()
                    .setTitle('ERROR')
                    .setDescription('you are not the creator of that round')
                    .setColor(0xff0000)
                )

                break
        }
    }
})


bot.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return
    var ch = reaction.message.channel
    var chID = ch.id
    if (available(reaction.message.id, akis)) {
        console.log(reaction.emoji.name)
        switch (reaction.emoji.name) {
            case emojis.yes:
                if (akis[chID].users.includes(user.id)) return reaction.users.remove(user.id)
                akis[chID].c["0"]++
                akis[chID].users.push(user.id)
                break
            case emojis.no:
                if (akis[chID].users.includes(user.id)) return reaction.users.remove(user.id)
                akis[chID].c["1"]++
                akis[chID].users.push(user.id)
                break
            case emojis.idk:
                if (akis[chID].users.includes(user.id)) return reaction.users.remove(user.id)
                akis[chID].c["2"]++
                akis[chID].users.push(user.id)
                break
            case emojis.maybe:
                if (akis[chID].users.includes(user.id)) return reaction.users.remove(user.id)
                akis[chID].users.push(user.id)
                akis[chID].c["3"]++
                break
            case emojis.maybeNot:
                if (akis[chID].users.includes(user.id)) return reaction.users.remove(user.id)
                akis[chID].c["4"]++
                akis[chID].users.push(user.id)
                break
            case emojis.reverse:
                if (akis[chID].users.includes(user.id)) return reaction.users.remove(user.id)
                akis[chID].c["r"]++
                akis[chID].users.push(user.id)
                break
        }

    }
})/*
bot.on('messageReactionRemove', (reaction, user) => {
    if (user.bot) return
    var ch = reaction.message.channel
    var chID = ch.id
    if (available(reaction.message.id, akis)) {
        console.log(reaction.emoji.name)
        switch (reaction.emoji.name) {
            case '0️⃣':
                if (akis[chID].users.includes(user.id)) {
                    akis[chID].c["0"]--
                    removeFromArray(akis[chID].users, user.id)
                }
                break
            case '1️⃣':
                if (akis[chID].users.includes(user.id)) {
                    akis[chID].c["1"]--
                    removeFromArray(akis[chID].users, user.id)
                }
                break
            case '2️⃣':
                if (akis[chID].users.includes(user.id)) {
                    akis[chID].c["2"]--
                    removeFromArray(akis[chID].users, user.id)
                }
                break
            case '3️⃣':
                if (akis[chID].users.includes(user.id)) {
                    akis[chID].c["3"]--
                    removeFromArray(akis[chID].users, user.id)
                }
                break
            case '4️⃣':
                if (akis[chID].users.includes(user.id)) {
                    akis[chID].c["4"]--
                    removeFromArray(akis[chID].users, user.id)
                }
                break
            case '↩️':
                if (akis[chID].users.includes(user.id)) {
                    akis[chID].c["r"]--
                    removeFromArray(akis[chID].users, user.id)
                }
                break
        }

    }

})*/

async function updateAki(akis, chID, rev = false, answ,) {
    var emoji
    akis[chID].c = {
        "0": 0,
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "r": 0
    }
    switch (answ) {
        case 0:
            emoji = emojis.yes
            break
        case 1:
            emoji = emojis.no

            break
        case 2:
            emoji = emojis.idk

            break
        case 3:
            emoji = emojis.maybe
            break
        case 4:
            emoji = emojis.maybeNot
            break
        default:
            emoji = emojis.reverse

    }
    akis[chID].users = []
    var previus = akis[chID].question
    if (rev) {
        await akis[chID].back();
    }
    else {
        await akis[chID].step(answ);
    }
    if (akis[chID].progress >= maxPercent || akis[chID].currentStep >= 78) {
        return stop(akis, chID)
    }
    var akimsg = sendAki(akis, chID)
    akis[chID].m.channel.stopTyping(true)
    await akis[chID].m.edit(new MessageEmbed()
        .setTitle(akimsg[1])
        .setDescription(akimsg[0])
        .addField('progress', akis[chID].progress)
        .addField('Previus:', `**${previus}** \n picked answer: ${emoji}`)
    )
}



async function trigger(akis, chID) {
    for (let i in akis) {
        chID = i
        var sorted = sort(akis[chID].c)
        console.log('sorted', sorted)
        var max = sorted[sorted.length - 1]
        if (max[1] === 0) max = sorted[sorted.length - 2]
        console.log('max', max)
        switch (max[0]) {
            case '0':
                await updateAki(akis, chID, false, 0)
                break
            case '1':
                await updateAki(akis, chID, false, 1)
                break
            case '2':
                await updateAki(akis, chID, false, 2)
                break
            case '3':
                await updateAki(akis, chID, false, 3)
                break
            case '4':
                await updateAki(akis, chID, false, 4)
                break
            case 'r':
                await updateAki(akis, chID, true)

        }

        if (akis[chID]) {
            await akis[chID].m.reactions.removeAll()
            await akis[chID].m.react(emojis.yes)
            await akis[chID].m.react(emojis.no)
            await akis[chID].m.react(emojis.idk)
            await akis[chID].m.react(emojis.maybe)
            await akis[chID].m.react(emojis.maybeNot)
            await akis[chID].m.react(emojis.reverse)

        }


        /*akis[chID].m.reactions.removeAll().then(() => {
            akis[chID].m.react('0️⃣').then(() => {
                akis[chID].m.react('1️⃣').then(() => {
                    akis[chID].m.react('2️⃣').then(() => {
                        akis[chID].m.react('3️⃣').then(() => {
                            akis[chID].m.react('4️⃣').then(() => {
                                akis[chID].m.react('↩️')
                            })
                        })
                    })
                })
            })
        })*/
    }
}




async function stop(akis, chID) {
    if (!available(chID, akis)) {
        var chars = '\n'
        //message.channel.startTyping()
        akis[chID].m.reactions.removeAll()
        akis[chID].m.channel.stopTyping(true)
        await akis[chID].win()
        console.log(akis[chID].answers)
        for (let i in akis[chID].answers) {
            var value = akis[chID].answers[i]
            if (i == 0) {
                chars = chars + '**' + value.name + '**' + ` (${value.description})\n `
            }
            else {
                chars = chars + value.name + ` (${value.description})\n`
            }
        }
        console.log(akis[chID].answers[0].absolute_picture_path)
        await akis[chID].m.edit(new MessageEmbed()
            .setTitle('Round over!')
            .setDescription(`I thought of ${chars}`)
            .setImage(akis[chID].answers[0].absolute_picture_path)

        )
        delete akis[chID]
        //message.channel.stopTyping()
    }
}


function available(id, akis) {
    can = true
    for (let i in akis) {//check if in this channel is already an round
        if (id == i) can = false
    }
    return can
}
function sendAki(akis, chID) {
    var desc = `
${emojis.yes} = v
${emojis.no} = v
${emojis.idk} = v
${emojis.maybe} = v
${emojis.maybeNot} = v
${emojis.reverse} = back
                    `
    for (let i in akis[chID].answers) {
        var value = akis[chID].answers[i]
        desc = desc.replace('v', value)
    }
    return [desc, akis[chID].question]
}


function sort(value) {
    var sortable = [];
    for (var i in value) {
        sortable.push([i, value[i]]);
    }

    sortable.sort(function (a, b) {
        return a[1] - b[1];
    });
    return sortable
}

function flip(object) {
    var newObject = {};
    var keys = [];

    for (var key in object) {
        keys.push(key);
    }

    for (var i = keys.length - 1; i >= 0; i--) {
        var value = object[keys[i]];
        newObject[keys[i]] = value;
    }

    return newObject;
}
function removeFromArray(arr, elt) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] == elt) {
            arr.splice(i, 1);
        }
    }
    return arr;
}
//console.log(sort({ '0': 0, '1': 300, '2': 300, '3': 0, '4': 0, "r": 0 }))

bot.login(token)