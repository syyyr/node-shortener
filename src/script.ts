import isWebUri from "valid-url";

const printError = (err: string) => {
    const output = document.createElement("div");
    output.className = "errorOutput";
    output.innerText = `ERROR: ${err}`
    document.getElementById("output")!.appendChild(output);
}

const shorten = async () => {
    document.getElementById("output")!.innerHTML = "";
    const value = (<HTMLInputElement>document.getElementById("input")!).value;
    try {
        const response = await fetch("/", {
            body: JSON.stringify({ url: value }),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST"
        });

        if (!response.ok) {
            printError(response.statusText);
            return;
        }

        const json = await response.json();

        if (!json.ok) {
            printError(json.error);
            return;
        }

        const output = document.createElement("div");
        output.className = "output";
        output.innerText = "Your link: ";
        const url = `${document.URL}${json.short}`;
        const link = document.createElement("a");
        link.href = url;
        link.innerText = url;
        link.className = "link";
        output.appendChild(link);
        document.getElementById("output")!.appendChild(output);
    } catch (err) {
        printError("Internal server error.");
    }
};

let input = document.getElementById("input")!;

input.oninput = (ev) => {
    document.getElementById("output")!.innerHTML = "";
    const target = (<HTMLInputElement>ev.target);
    if (target.value === "" || isWebUri.isWebUri(target.value)) {
        document.getElementById("fieldBgError")?.remove();
        target.classList.replace("errorInput", "okInput");
    } else {
        target.classList.replace("okInput", "errorInput");

        if (document.getElementById("fieldBgError") === null) {
            let elem = document.createElement("div");
            elem.innerText = "invalid url";
            elem.id = "fieldBgError";
            target.insertAdjacentElement("afterend", elem);
        }
    }
}

input.onkeypress = (ev) => {
    if (ev.key === "Enter") {
        shorten();
    }
}

document.getElementById("send")!.onclick = shorten;
