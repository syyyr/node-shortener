import * as Mongo from "mongodb";
import express from "express";
import md5 from "md5";

let client = new Mongo.MongoClient("mongodb://localhost:27017/shortener", {
    useUnifiedTopology: true
});
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

const app = express();
var options = {
    dotfiles: "ignore"
};

app.use(express.static("static", options));
app.use(express.json());

app.get("/:link", async (req, response) => {
    let shortUrl = req.params["link"];
    console.log(`GET /${shortUrl}`);
    try {
        let resolved = await resolveShortened(shortUrl);
        console.log(`${shortUrl} is resolved to "${resolved}"`);
        response.redirect(resolved);
    } catch (err) {
        response.send(err.message);
    }
});

const isValidReqBody = (body: any): body is { url: string } => {
    return typeof body === "object" && typeof body.url === "string";
};

app.post("/", async (req, response) => {
    console.log(`POST /, body:`, req.body);
    if (isValidReqBody(req.body)) {
        let shortUrl = await createShortened(req.body.url);
        response.json({ ok: true, ...req.body, short: shortUrl });
    } else {
        response.json({ ok: false, error: "Request was invalid." });
    }
});

client.connect().then(() => {
    database = client.db().collection("shortener");
    app.listen(3000);
});
