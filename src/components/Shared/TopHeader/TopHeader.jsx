import React from 'react';
import './index.css';
import { FaFacebookSquare, FaInstagramSquare, FaLinkedin, FaGithubSquare, FaPhoneAlt, FaEnvelope  } from "react-icons/fa";

const TopHeader = () => {
    return (
        <div id="topbar" className="d-flex align-items-center fixed-top">
            <div className="container d-flex justify-content-between">
                <div className="contact-info d-flex align-items-center">
                    <FaEnvelope className='contact-icon'/> <a href="mailto:ujjalzaman@example.com">mdfarhank866@gmail.com</a>
                    <FaPhoneAlt className='contact-icon'/> <a href="tel:+88 01751 040425">+91 7800629106</a> 
                </div>
                <div className="d-none d-lg-flex social-links align-items-center">
                    <a href="https://www.linkedin.com/in/md-farhan-khan-53a2a5217" target='_blank' rel="noreferrer" className="linkedin"><FaLinkedin /></a>
                
                    <a href="https://github.com/Farhankhan1212" target='_blank' rel="noreferrer" className=""><FaGithubSquare /></a>
                    <a href="https://www.instagram.com/khaanfarhan01?igsh=anQ5Y3FxN3kza3N4" target='_blank' rel="noreferrer" className="instagram"><FaInstagramSquare /></a>
                </div>
            </div>
        </div>
    );
};
export default TopHeader;