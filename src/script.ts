import isWebUri from "valid-url";

const printError = (err: string) => {
    const output = document.createElement("div");
    output.className = "errorOutput";
    output.innerText = `ERROR: ${err}`
    document.getElementById("output")!.appendChild(output);
}

const processInput = (input: string) => {
    if (input === "") {
        return "";
    }
    if (/^.+:\/\//.test(input)) {
        hidePlaceholder();
        return input;
    } else {
        showPlaceholder();
        return `http://${input}`;
    }
};

let enterToCopy = false;
let enterToCopyUrl: string;

const shorten = async () => {
    document.getElementById("output")!.innerHTML = "";
    const value = processInput((<HTMLInputElement>document.getElementById("input")!).value);
    if (value === "") {
        return;
    }
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
        output.innerText = "Your link (press Enter to copy to clipboard): ";
        const url = `${document.URL}${json.short}`;
        const link = document.createElement("a");
        link.href = url;
        link.innerText = url;
        link.className = "link";
        output.appendChild(link);
        document.getElementById("output")!.appendChild(output);
        enterToCopy = true;
        enterToCopyUrl = url;
    } catch (err) {
        printError("Internal server error.");
    }
};

const placeholder = document.getElementById("httpHint")!;
const placeholderWidth = placeholder.offsetWidth;
const input = document.getElementById("input")!;

const showPlaceholder = () => {
    placeholder.style.display = "inline-block";
    input.style.paddingLeft = `${placeholderWidth}px`;
    input.style.width = `calc(100% - ${placeholderWidth}px)`;
};

const hidePlaceholder = () => {
    placeholder.style.display = "none";
    input.style.paddingLeft = "0px";
    input.style.width = "100%";
};

showPlaceholder();


input.oninput = (ev) => {
    document.getElementById("output")!.innerHTML = "";
    const target = (<HTMLInputElement>ev.target);

    const input = processInput(target.value);

    if (input === "" || isWebUri.isWebUri(input)) {
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

const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
        document.getElementById("copied")!.style.display = "inline-block";
    }).catch(() => {
        document.getElementById("copiedError")!.style.display = "inline-block";
    });
};

const handleKeyPress = (keyName: string) => {
    if (keyName === "Enter") {
        if (enterToCopy) {
            copyToClipboard(enterToCopyUrl);
        } else {
            shorten();
        }
    } else {
        enterToCopy = false;
        document.getElementById("copied")!.style.display = "none";
        document.getElementById("copiedError")!.style.display = "none";
    }
};


input.onkeypress = (ev) => {
    handleKeyPress(ev.key);
};

// I want backspace to delete output. I want the keys to be as responsive as possible, so I can't use onChange.
input.onkeydown = (ev) => {
    if (ev.key === "Backspace") {
        handleKeyPress("ev.key");
    }
};

document.getElementById("send")!.onclick = shorten;
