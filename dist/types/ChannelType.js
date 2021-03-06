"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SyntaxParseError_1 = require("../errors/SyntaxParseError");
const BaseType_1 = require("./BaseType");
class ChannelType extends BaseType_1.BaseType {
    constructor(opts) {
        super(opts);
        this.options = {
            argName: opts.argName,
            required: opts.required || false,
            rest: opts.rest,
            typeName: "channel",
        };
    }
    match(client, message, arg) {
        let snowflake = "";
        const name = "";
        if (arg.value.startsWith("<")) {
            snowflake = arg.value.replace(/[<@#>]/g, "");
        }
        else if (!isNaN(parseInt(arg.value, 10))) {
            snowflake = arg.value;
        }
        if (snowflake === "") {
            throw new SyntaxParseError_1.SyntaxParseError({
                expectedArgument: this,
                message: `could not parse \`${arg.value}\` to type \`${this.string}\``,
                recievedArgument: arg,
                type: "PARSE_FAILED",
            });
        }
        const channel = message.guild.channels.get(snowflake);
        const channelFromName = message.guild.channels.find((v) => v.name === arg.value);
        if (!channel && !channelFromName) {
            throw new SyntaxParseError_1.SyntaxParseError({
                expectedArgument: this,
                message: `could not find channel \`${arg.value}\``,
                recievedArgument: arg,
                type: "PARSE_FAILED",
            });
        }
        else if (channel) {
            return channel;
        }
        else {
            return channelFromName;
        }
    }
}
exports.ChannelType = ChannelType;
