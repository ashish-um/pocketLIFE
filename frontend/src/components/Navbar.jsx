import React, { useState } from 'react'
import "../index.css";
import AuthButton from '../components/AuthButton.jsx';
import Colours from './Colours.jsx';


const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <nav className="nav">
            <div className="logo">
                <a className='logo' href="/">
                    <img src="fav.ico" alt="" />
                    <span>PocketLIFE</span>
                </a>
            </div>

            {/* Menu */}
            <div className={`comp ${isOpen ? "open" : ""}`}>
                <ul>
                    <li>Home</li>
                    <li>My Diary</li>
                    <li><AuthButton /></li>
                </ul>
            </div>

            {/* Hamburger */}
            <div
                className={`hamburger ${isOpen ? "active" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
    )
}

export default Navbar