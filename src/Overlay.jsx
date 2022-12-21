import "Overlay.css";

import KU_LOGO from "assets/ku.svg";

export const Overlay = () => {
    return (
        <div className="overlay">
            <a href="/" style={{ fontWeight: 900, textAlign: 'right', position: 'absolute', top: 50, right: 50, rotate: '-90deg' }}>
                Merry<br />Messy<br />Fantasy
            </a>
            <div style={{ fontWeight: 200, display: 'flex', gap: 10, position: 'absolute', bottom: 50, right: 20 }}>
                <div style={{ textAlign: 'right' }}>
                    KUFA<br />The Graduation Exhibition 2021
                </div>
                <img src={KU_LOGO} alt="" width={35} />
            </div>
        </div>
    );
}
