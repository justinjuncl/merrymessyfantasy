import "Overlay.css";

import KU_LOGO from "assets/ku.svg";

export const Overlay = () => {
    return (
        <div className="overlay">
            <a href="/" style={{ textAlign: 'right', position: 'absolute', top: 50, right: 100 }}>
                Merry<br />Messy<br />Fantasy
            </a>
            <div style={{ display: 'flex', gap: 10, position: 'absolute', bottom: 50, right: 100 }}>
                <div style={{ textAlign: 'right' }}>
                    Korea University<br />Department of Fine Arts<br />The Graduation Exhibition 2021
                </div>
                <img src={KU_LOGO} alt="" width={35} />
            </div>
        </div>
    );
}
