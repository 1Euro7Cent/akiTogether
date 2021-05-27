const { Client, MessageEmbed } = require('discord.js')
const { Aki } = require('aki-api');

const { token, prefix, maxPercent } = require('./config.json')

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
    console.log(`Bot logged in as ${bot.user.tag}`)
})
bot.on('message', async (message) => {
    var chID = message.channel.id
    var [cmd, ...args] = message.content
        .toLowerCase()
        .trim()
        .substring(prefix.length)
        .split(/\s/);


    switch (cmd) {
        case 'start':

            if (available(chID, akis)) {//check if in this channel is already an round
                message.channel.startTyping()
                akis[chID] = new Aki('de')
                await akis[chID].start()
                var akimsg = sendAki(akis, chID)


                await message.channel.send(new MessageEmbed()
                    .setTitle(akimsg[1])
                    .setDescription(akimsg[0])
                ).then(m => {
                    m.react('0️⃣')
                    m.react('1️⃣')
                    m.react('2️⃣')
                    m.react('3️⃣')
                    m.react('4️⃣')
                    m.react('↩️')
                    akis[chID].m = m
                })
                message.channel.stopTyping()
            }
            break
        case 'stop':
            stop(akis, chID)

            break
    }
})


bot.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return
    var ch = reaction.message.channel
    var chID = ch.id
    if (available(reaction.message.id, akis)) {
        console.log(reaction.emoji.name)
        switch (reaction.emoji.name) {
            case '0️⃣':
                reaction.users.remove(user.id)
                updateAki(akis, chID, false, 0)
                break
            case '1️⃣':
                reaction.users.remove(user.id)
                updateAki(akis, chID, false, 1)
                break
            case '2️⃣':
                reaction.users.remove(user.id)
                updateAki(akis, chID, false, 2)
                break
            case '3️⃣':
                reaction.users.remove(user.id)
                updateAki(akis, chID, false, 3)
                break
            case '4️⃣':
                reaction.users.remove(user.id)
                updateAki(akis, chID, false, 4)
                break
            case '↩️':
                reaction.users.remove(user.id)
                updateAki(akis, chID, true, 4)
                break
        }

    }
})
async function updateAki(akis, chID, rev = false, answ) {
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
    await akis[chID].m.edit(new MessageEmbed()
        .setTitle(akimsg[1])
        .setDescription(akimsg[0])
        .addField('progress', akis[chID].progress)
    )

}
async function stop(akis, chID) {
    if (!available(chID, akis)) {
        var chars = '\n'
        //message.channel.startTyping()
        await akis[chID].win()
        console.log(akis[chID].answers)
        for (let i in akis[chID].answers) {
            var value = akis[chID].answers[i]
            if (i == 0) {
                chars = chars + '**' + value.name + '**' + '\n'
            }
            else {
                chars = chars + value.name + '\n'
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
0️⃣ = v
1️⃣ = v
2️⃣ = v
3️⃣ = v
4️⃣ = v
↩️ = back
                    `
    for (let i in akis[chID].answers) {
        var value = akis[chID].answers[i]
        desc = desc.replace('v', value)
    }
    return [desc, akis[chID].question]
}



bot.login(token)