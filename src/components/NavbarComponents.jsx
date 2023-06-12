import React from 'react'
import {Navbar, Container} from "react-bootstrap"
import logo from "../assets/Logo.png"


const NavbarComponents = () => {
  return ( 
    <div>
        <Navbar expand="lg" className='navbar-custom'>
            <Container>
                <Navbar.Brand href="/">
                    <img
                        src= {logo}
                        width="248"
                        height="56"
                    />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
            </Container>
        </Navbar>
    </div>
  );
}

export default NavbarComponents