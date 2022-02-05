import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://tunestamp.com" rel="noopener noreferrer">
      <PageHeader
        title="TuneStamp"
        subTitle="mint rare NFTs with your music"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
