"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const discord_js_1 = require("discord.js");
const Command_1 = require("../structures/Command");
const DefaultConfigProvider_1 = require("../structures/providers/DefaultConfigProvider");
const Constants_1 = require("../util/Constants");
const Util_1 = require("../util/Util");
const CommandRegistry_1 = require("./CommandRegistry");
const PluginManager_1 = require("./PluginManager");
/**
 * The main client used to interact with the API.
 */
class SparklClient extends discord_js_1.Client {
    /**
     * @param {SparklClientOptions} [options] Options for the client
     */
    constructor(options) {
        super(options);
        this.options = Object.assign(Constants_1.DEFAULT_OPTIONS, options);
        // Public declarations
        this.logger = Util_1.createLogger(this.options.loggerDebugLevel || 0);
        this.config = new DefaultConfigProvider_1.DefaultConfigProvider();
        // Private declarations
        this.pluginManager = new PluginManager_1.PluginManager(this);
        this.registry = new CommandRegistry_1.CommandRegistry(this);
        this.pluginHandlerMap = new Map();
        this.on("debug", (m) => this.logger.debug(m));
        this.on("error", (e) => {
            this.logger.error(e.message);
            this.logger.debug(e);
        });
    }
    /**
     * Triggers the login process with the Discord API. Use this to start your bot.
     * @param {string} [token] - The bot token to use.
     * @returns {Promise<SparklClient>}
     * @example
     * client.login("token here").then(() => {
     * 		console.log("Logged in!");
     * });
     */
    async login(token) {
        if (this.options.loggerDebugLevel) {
            this.logger.info("Starting...");
        }
        else {
            this.logger.info("Starting... | " + Util_1.rainbow("sparkldjs") + " v" + Constants_1.VERSION);
        }
        if (!token && !this.options.token) {
            throw TypeError("No token provided");
        }
        if (token) {
            this.options.token = token;
        }
        logSettings(this);
        this.logger.debug("Attempting to connect to Discord...");
        await super.login(this.options.token).catch((err) => {
            this.logger.error(err);
            this.logger.error("Failed to connect to Discord.");
            process.exit(err.code);
            return token;
        });
        this.logger.info("Connected and logged into Discord API.");
        this.logger.debug(`Authed for user ${chalk_1.default.green(this.user.tag)}, ${this.user.id}`);
        // Initialise config
        this.logger.debug("[config] Initializing config provider...");
        await this.config.init(this);
        this.logger.debug("[config] Done.");
        if (!this.user.bot) {
            this.logger.warn("The automation of user accounts is in violation of Discord's terms of service!");
            this.logger.warn("It is not recommended to proceed with your current token, as your account may be terminated.");
            this.logger.warn("You can read more here: https://discordapp.com/guidelines");
        }
        this.logger.debug("Login flow complete.");
        return this.options.token;
    }
    /**
     * Disconnects the client from the API
     */
    disconnect() {
        super.destroy();
        return this;
    }
    /**
     * Adds a plugin to the client
     */
    plugin(name, start) {
        this.pluginManager.createPlugin(name, start);
        return this;
    }
    /**
     * Adds a plugin to the client
     */
    addPlugin(...modules) {
        modules.forEach((m) => this.pluginManager.addPlugin(m));
        return this;
    }
    /**
     * Add a command to the client
     * @param name Name of the command
     * @param permissionLevel Permission of the command
     * @param syntax Command's syntax
     * @param executable The executable to run when the command is triggered
     * @param options Customization options
     */
    command(name, permissionLevel, syntax, executable, options) {
        const group = name.split(".").length > 1
            ? name.split(".").slice(0, name.split(".").length - 1)
            : undefined;
        const nameMinusGroup = name.split(".").pop() || name;
        return this.registry.addCommand(new Command_1.Command({
            executable,
            group,
            name: nameMinusGroup,
            permissionLevel,
            syntax,
            plugin: options ? options.plugin : undefined,
        }));
    }
    /**
     * Adds a config plugin to the client
     * @param {ConfigPlugin|ConfigPluginConstructor} config - Config plugin to use
     */
    useConfigProvider(provider) {
        this.config = provider;
        return this;
    }
    on(eventName, listener, plugin) {
        super.on(eventName, listener);
        if (plugin) {
            let pluginListeners = this.pluginHandlerMap.get(plugin);
            if (pluginListeners) {
                pluginListeners.push(listener);
            }
            else {
                pluginListeners = [listener];
            }
            this.pluginHandlerMap.set(plugin, pluginListeners);
        }
        return this;
    }
}
exports.SparklClient = SparklClient;
function logSettings(client) {
    const headerString = `---------=[ ${Util_1.rainbow("sparkldjs")} ${Constants_1.VERSION} ]=---------`;
    client.logger.debug(headerString);
    client.logger.debug("Using the following settings:");
    Object.keys(client.options).forEach((key) => {
        const res = key.replace(/([A-Z])/g, " $1");
        client.logger.debug(` - ${chalk_1.default.cyan(res.charAt(0).toUpperCase() + res.slice(1))}: ${
        // @ts-ignore
        client.options[key]}`);
    });
    client.logger.debug("-".repeat(`---------=[ sparkldjs ${Constants_1.VERSION} ]=---------`.length));
}
