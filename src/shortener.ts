import * as Mongo from "mongodb";
import express from "express";
import fs from "fs";
import md5 from "md5";
import isWebUri from "valid-url";
import path from "path";

let database: Mongo.Collection;
const resolveShortened = async (shortUrl: string): Promise<string> => {
    let res = await database.find({ _id: shortUrl }).toArray();
    if (res.length === 1) {
        return res[0].url;
    } else if (res.length === 0) {
        throw new Error(`${shortUrl} is not shortened to anything.`);
    } else {
        throw new Error(`Logic error! Url ${shortUrl} is ambiguous!`);
    }
};

const createShortened = async (url: string): Promise<string> => {
    let shortUrl = md5(url).slice(0, 6);

    if ((await database.find({ _id: shortUrl }).count()) === 0) {
        await database.insertOne({ url, _id: shortUrl });
    }
    return shortUrl;
};

const isValidReqBody = (body: any): body is { url: string } => {
    return typeof body === "object" && typeof body.url === "string";
};

const file = fs.readFileSync(path.join(__dirname, "../template/redirect.html"), {
    encoding: "utf8"
});

const generateRedirectPage = (url: string): string => {
    return file.replace(/@URL@/gu, Buffer.from(url).toString("base64"));
};

const shortener = async (prefix = "", logger = (msg: string, _res?: express.Response) => console.log(msg)) => {
    const client = new Mongo.MongoClient("mongodb://localhost:27017/shortener", {
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 1000
    } as Mongo.MongoClientOptions); // Typings are wrong and don't have serverSelectionTimeoutMS
    logger("Connecting to mongodb...");
    await client.connect().catch((err) => {logger(err);});
    if (!client.isConnected()) {
        throw new Error("Can't initialize shortener.");
    }
    logger("Connected to mongodb.");
    database = client.db().collection("shortener");
    const router = express.Router();

    router.use(prefix, express.static(path.join(__dirname + "/../dist"), {
        dotfiles: "ignore",
    }));
    router.use(express.json());

    router.get(prefix + "/:link", async (req, res) => {
        let shortUrl = req.params["link"];
        try {
            let resolved = await resolveShortened(shortUrl);
            logger(`${shortUrl} is resolved to "${resolved}"`, res);
            res.send(generateRedirectPage(resolved));
        } catch (err) {
            res.send(err.message);
        }
    });

    router.post(prefix + "/", async (req, res) => {
        logger("New url to shorten.", res);
        if (isValidReqBody(req.body)) {
            if (!isWebUri.isWebUri(req.body.url)) {
                const errorMsg = `"${req.body.url}" is not a valid URL by my standards.`;
                logger(errorMsg, res);
                res.json({ ok: false, error: errorMsg});
                return;
            }
            let shortUrl = await createShortened(req.body.url);
            logger(`New short url created: ${shortUrl}`, res);
            res.json({ ok: true, ...req.body, short: shortUrl });
        } else {
            logger("Invalid request.", res);
            res.json({ ok: false, error: "Invalid request." });
        }
    });

    logger("Shortener initialized.");

    return router;
}

export default shortener;
