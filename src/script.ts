const printError = (err: string) => {
    const output = document.createElement("div");
    output.className = "error";
    output.innerText = `ERROR: ${err}`
    document.getElementById("output")!.appendChild(output);
}

document.getElementById("send")!.onclick = async () => {
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
