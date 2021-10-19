import React, { useCallback } from "react";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import { PageProps } from "@util/pageUtils";
import DuoRequestTemplate from "@components/templates/DuoRequest";
import Navigation from "@components/organism/Navigation";
import { regionsDropdown } from "@type/constant";
import useProfileSearch from "@hooks/useProfileSearch";
import { ProfileParams } from "@util/profileQueryParser";
import { event } from "@util/ga";

export { getServerSideProps } from "@util/pageUtils";
const DuoRequestPage: React.FC<PageProps> = () => {
  const { t } = useTranslation();
  const { search: profileSearch } = useProfileSearch();
  const profileSearchWithGa = useCallback(
    (params: ProfileParams) => {
      event({
        action: "search_summoner_header",
      });
      return profileSearch(params);
    },
    [profileSearch]
  );

  return (
    <>
      <Head>
        <title>KDA.AI - {t("common:duoRequest")}</title>
      </Head>
      <DuoRequestTemplate
        navigation={
          <Navigation regions={regionsDropdown} search={profileSearchWithGa} />
        }
      />
    </>
  );
};

export default DuoRequestPage;
