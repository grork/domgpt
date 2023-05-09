interface IMessageElement {
    el: string;
    content: String | IMessageElement[];
}

const message = [
    [
        {
            el: "p",
            content: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Nisi vitae suscipit tellus mauris. Est lorem ipsum dolor sit amet consectetur. Feugiat sed lectus vestibulum mattis ullamcorper velit sed ullamcorper morbi. Lectus mauris ultrices eros in cursus turpis massa. Duis ut diam quam nulla porttitor massa id neque aliquam. Dolor sit amet consectetur adipiscing elit pellentesque habitant. Ut eu sem integer vitae justo eget magna fermentum. Vel elit scelerisque mauris pellentesque pulvinar pellentesque habitant. Convallis convallis tellus id interdum velit. Cras sed felis eget velit. Mattis aliquam faucibus purus in massa tempor nec."
        }
    ],
    [
        {
            el: "p",
            content: "The quick brown fox jumped over the lazy fox"
        },
        {
            el: "ul",
            content: [
                {
                    el: "li",
                    content: "1 lb of Carrots"
                },
                {
                    el: "li",
                    content: [
                        {
                            el: "strong",
                            content: "Spicy"
                        },
                        {
                            el: "",
                            content: " peppers"
                        }
                    ]
                }
            ]
        }
    ]
];

const questions = [
    { text: "When is Dominic on Vacation?", response: 0 },
    { text: "Where is Dominic going on Vacation?", response: 1 }
];

function delay(duration: number): Promise<void> {
    return new Promise<void>((r) => {
        setTimeout(r, duration);
    });
}

function cloneIntoWithPartsFromName<T>(templateName: string, target: Element): T {
    const template = document.querySelector<HTMLTemplateElement>(`[data-template='${templateName}']`)!;

    return cloneIntoWithParts(template, target);
}

function cloneIntoWithParts<T>(template: HTMLTemplateElement, target: Element): T {
    const content = document.importNode(template.content, true);

    const parts: T = locatePartsFromDOM(content);

    target.appendChild(content);

    return parts;
}

function locatePartsFromDOM<T>(element: HTMLElement | DocumentFragment): T {
    const query = "[data-part]";
    const elements = Array.from(element.querySelectorAll(query));

    // Make sure that the node we're starting from is included.
    // querySelector only finds descendants of the element, not the element
    // itself.
    if (element.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        if ((<Element>element).matches(query)) {
            elements.push(<Element>element);
        }
    }

    const parts = elements.reduce<any>(
        (localParts: any, el: Element) => {
            const partName = el.getAttribute("data-part")!;
            el.removeAttribute("data-part");
            localParts[partName] = el;
            return localParts;
        },
        {});
    
    return parts;
}

async function renderTextResponse(container: HTMLElement, words: string[]) {
    let blockCursor = container.nextElementSibling;
    if (!blockCursor) {
        // Faux cursor that goes at the end
        blockCursor = document.createElement("span");
        blockCursor.classList.toggle("chat-block-cursor", true);
        blockCursor.textContent = "";
        container.parentElement?.appendChild(blockCursor);
    }

    while (words.length > 0) {
        const word = words.shift();
        container.textContent += `${word}${words.length > 0 ? ' ' : ''}`;

        container.offsetParent?.scrollTo(0, container.offsetTop + container.offsetHeight);

        await delay(74);        
    }

    blockCursor.remove();
}

async function renderMessagePartToContainer(container: HTMLElement, messageToPrint: IMessageElement) {
    const cannedResponseContainer = messageToPrint.el ? document.createElement(messageToPrint.el) : container;
    if (container !== cannedResponseContainer) {
        container.appendChild(cannedResponseContainer);
    }

    if (typeof messageToPrint.content === "string") {
        // Actual content wrapper
        const text = document.createElement("span");
        cannedResponseContainer.appendChild(text);
        await renderTextResponse(text, messageToPrint.content.split(" "));
    } else if (messageToPrint.content instanceof Array) {
        for (const child of messageToPrint.content) {
            await renderMessagePartToContainer(cannedResponseContainer, child);
        }
    }
}

async function renderAnswerResponse(container: HTMLElement, messagesToPrint: IMessageElement[]) {
    const answerParts: { response: HTMLDivElement } = cloneIntoWithPartsFromName("response-template", container);

    for (const messageToPrint of messagesToPrint) {
        await renderMessagePartToContainer(answerParts.response, messageToPrint);
    }
}

function renderQuestion(container: HTMLElement, question: string) {
    const questionWrapper: { question: HTMLDivElement } = cloneIntoWithPartsFromName("question-template", container);

    questionWrapper.question.textContent = question;
}

function submitQuestion(question: string) {
    let response = 0;
    for (const item of questions) {
        if (item.text === question) {
            response = item.response;
            break;
        }
    }
    renderQuestion(chatResponse, question);
    renderAnswerResponse(chatResponse, message[response]);
}

function renderHistoryItem(container: HTMLDivElement, question: { text: string, response: number }) {
    const stuff = cloneIntoWithPartsFromName<{ question: HTMLDivElement; interactive: HTMLAnchorElement }>("history-template", container);
    stuff.question.textContent = question.text;
    stuff.interactive.addEventListener("click", () => submitQuestion(question.text));
}

function getAndClearQuestion(): string {
    var question = entryInput.value;
    entryInput.value;
    return question;
}

const entryForm = document.querySelector("form[data-id='entry-form'") as HTMLFormElement;
const entryInput = document.querySelector("input[data-id='question-input']") as HTMLInputElement;
const chatResponse = document.querySelector(".chat-response > .chat-scroller") as HTMLDivElement;
const chatHistory = document.querySelector(".chat-history") as HTMLDivElement;

entryForm.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();

    submitQuestion(getAndClearQuestion());

    return false;
});

entryInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Enter") {
        return;
    }

    e.preventDefault();
    submitQuestion(getAndClearQuestion());    
});

for (const q of questions) {
    renderHistoryItem(chatHistory, q);
}