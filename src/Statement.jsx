import { useState } from "react";
import { useGlobalStore } from "Store";

export const Statement = ({ artist }) => {
    artist = artist.split(",")[0];
    const language = useGlobalStore(state => state.language);
    const text = require(`assets/statements/${language}/${artist}.html`).default;

    return (
        <div
            className="container"
            dangerouslySetInnerHTML={{ __html: text }}
        >
        </div>
    );
}
