import React from "react";

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <p>Copyright ⓒ Yu-Fen Lai {year}</p>
    </footer>
  );
}

export default Footer;
