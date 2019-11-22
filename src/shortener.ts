import * as Mongo from "mongodb";
import express from "express";
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


const shortener = async (prefix = "", logger = (_req: express.Request, msg: string) => console.log(msg)) => {
    const client = new Mongo.MongoClient("mongodb://localhost:27017/shortener", {
        useUnifiedTopology: true
    });
    await client.connect();
    database = client.db().collection("shortener");
    const router = express.Router();

    router.use(prefix, express.static(path.join(__dirname + "/../dist"), {
        dotfiles: "ignore",
    }));
    router.use(express.json());

    router.get(prefix + "/:link", async (req, response) => {
        let shortUrl = req.params["link"];
        try {
            let resolved = await resolveShortened(shortUrl);
            logger(req, `${shortUrl} is resolved to "${resolved}"`);
            response.redirect(resolved);
        } catch (err) {
            response.send(err.message);
        }
    });

    router.post(prefix + "/", async (req, response) => {
        logger(req, "New url to shorten.");
        if (isValidReqBody(req.body)) {
            if (!isWebUri.isWebUri(req.body.url)) {
                const errorMsg = `"${req.body.url}" is not a valid URL by my standards.`;
                logger(req, errorMsg);
                response.json({ ok: false, error: errorMsg});
                return;
            }
            let shortUrl = await createShortened(req.body.url);
            logger(req, `New short url created: ${shortUrl}`);
            response.json({ ok: true, ...req.body, short: shortUrl });
        } else {
            logger(req, "Invalid request." );
            response.json({ ok: false, error: "Invalid request." });
        }
    });

    return router;
}

export default shortener;
