import shortener from "./shortener";
import express from "express";

const app = express();
console.log("Initializing shortener...");
shortener().then((shortener) => {
    console.log("Shortener started.");
    app.use(shortener);
    app.listen(3000);
}).catch((err) => {
    console.log(err);
});





