"use strict";

const fs = require("fs");
const fetch = require("node-fetch");
const WebSocket = require("ws");

const config = {
    sniperGuild: "",
    sniperToken: "",
    infoChannelId: "",
};

const guilds = {};
const socket = new WebSocket("wss://gateway-us-east1-b.discord.gg");

socket.onmessage = async (message) => {
    const data = JSON.parse(message.data.toString());
    if (data.t === "GUILD_UPDATE") {
        const guild = guilds[data.d.guild_id];
        if ((guild || data.d.vanity_url_code) !== data.d.vanity_url_code) {
            const start = Date.now();
            await fetch(`https://canary.discord.com/api/v7/guilds/${config.sniperGuild}/vanity-url`, {
                method: "PATCH",
                headers: {
                    Authorization: config.sniperToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code: guild }),
            }).then(async (res) => {
                const end = Date.now();
                const elapsed = end - start;
                const elapsedSeconds = elapsed / 1000;
                const content = res.ok
                    ? `\`${guild}\`  (\`${elapsedSeconds}\``
                    : `\`${guild}\``;
                await fetch(`https://canary.discord.com/api/v7/channels/${config.infoChannelId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: config.sniperToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: content,
                    }),
                });
                return delete guilds[data.d.guild_id];
            });
        }
    }
    else if (data.t === "GUILD_DELETE") {
        const guild = guilds[data.d.id];
        if (guild) {
            await fetch(`https://discord.com/api/v7/guilds/${config.sniperGuild}/vanity-url`, {
                method: "PATCH",
                headers: {
                    Authorization: config.sniperToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code: guild }),
            }).then(async (res) => {
                const content = res.ok
                    ? `${guild}  *guild_delete* `
                    : `Error  \`${guild}\`
                    discord.gg/${guild}. `;
                await fetch(`https://canary.discord.com/api/v10/channels/${config.infoChannelId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: config.sniperToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: content,
                    }),
                });
                return delete guilds[data.d.id];
            });
        }
    }
    else if (data.t === "READY") {
        for (let guild of data.d.guilds) {
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
                intents: 513 << 0,
                properties: {
                    os: "macos",
                    browser: "Safari",
                    device: "MacBook Air",
                },
            },
        }));
        setInterval(() => socket.send(JSON.stringify({ op: 0.1 })), data.d.heartbeat_interval);
    }
};

socket.onclose = (event) => {
    console.log(`[hata] Soket bağlantısı kapatıldı, neden: ${event.reason}, kod: ${event.code}`);
    return process.exit();
};
