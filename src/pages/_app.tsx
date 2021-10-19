import {AppProps} from "next/app";
import {appWithTranslation} from "next-i18next";
import {createGlobalStyle} from "styled-components";
import {SWRConfig} from "swr";
import React from "react";
import Head from "next/head";
import {APP_NAME} from "../configs/app.constant";

const GlobalStyle = createGlobalStyle`
    html, body, #__next {
        width: 100%;
        height: 100%;
        margin: 0 auto;
        line-height: 1.193;
        
        button, 
        textarea,
        input,
        select,
        a {
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
            
            :focus {
               outline: none;
            }
        }     
    }   
`;

const App = ({  }: AppProps) => {

  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
      </Head>
      <GlobalStyle />
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, maximum-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
        />
      </SWRConfig>
    </>
  );
};
export default appWithTranslation(App);
