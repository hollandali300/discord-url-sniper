const https = require("https");
const WebSocket = require("ws");

const config = {
    sniperGuild: "1205848478907899924",
    sniperToken: "MTEwODc5ODc4MzUxODY3MDkwOA.GmUMoN.-aT0LiMkxqLkNqBjC-UHz1pYb2QmCDGCYEbMz8",
    infoChannelId: "1208058102851706911",
};

const guilds = {};
const socket = new WebSocket("wss://gateway.discord.gg");

socket.onmessage = async (message) => {
    const data = JSON.parse(message.data.toString());

    if (data.t === "GUILD_UPDATE") {
        const guild = guilds[data.d.guild_id];
        if ((guild || data.d.vanity_url_code) !== data.d.vanity_url_code) {
            const start = Date.now();
            const req = https.request(`https://canary.discord.com/api/v7/guilds/${config.sniperGuild}/vanity-url`, {
                method: "PATCH",
                headers: {
                    Authorization: config.sniperToken,
                    "Content-Type": "application/json",
                },
            }, async (res) => {
                const elapsedSeconds = (Date.now() - start) / 1000;
                const content = res.statusCode === 200
                    ? `\`${guild}\`  \`${elapsedSeconds}\``
                    : ``;

                const req2 = https.request(`https://canary.discord.com/api/v7/channels/${config.infoChannelId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: config.sniperToken,
                        "Content-Type": "application/json",
                    },
                }, async (res2) => {
                    delete guilds[data.d.guild_id];
                });

                req2.write(JSON.stringify({ content: content }));
                req2.end();
            });

            req.write(JSON.stringify({ code: guild }));
            req.end();
        }
    }
    else if (data.t === "GUILD_DELETE") {
        const guild = guilds[data.d.id];
        if (guild) {
            const req = https.request(`https://discord.com/api/v7/guilds/${config.sniperGuild}/vanity-url`, {
                method: "PATCH",
                headers: {
                    Authorization: config.sniperToken,
                    "Content-Type": "application/json",
                },
            }, async (res) => {
                const content = res.statusCode === 200
                    ? `${guild}  *guild_delete* `
                    : `Error  \`${guild}\`
                    discord.gg/${guild}. `;

                const req2 = https.request(`https://canary.discord.com/api/v7/channels/${config.infoChannelId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: config.sniperToken,
                        "Content-Type": "application/json",
                    },
                }, async (res2) => {
                    delete guilds[data.d.id];
                });

                req2.write(JSON.stringify({ content: content }));
                req2.end();
            });

            req.write(JSON.stringify({ code: guild }));
            req.end();
        }
    }
    else if (data.t === "READY") {
        for (const guild of data.d.guilds) {
            if (guild.vanity_url_code)
                guilds[guild.id] = guild.vanity_url_code;
        }
        console.log(guilds);
    }

    if (data.op === 10) {
        socket.send(JSON.stringify({
            op: 2,
            d: {
                token: config.sniperToken,
                intents: 513 ,
                properties: {
                    os: "macos",
                    browser: "Safari",
                    device: "mybot",
                },
            },
        }));
        setInterval(() => socket.send(JSON.stringify({ op: 0.02 })), data.d.heartbeat_interval);
    }
};

socket.onclose = (event) => {
    console.log(`[hata] Soket bağlantısı kapatıldı, neden: ${event.reason}, kod: ${event.code}`);
    process.exit();
};
