import React from "react";
import Error from "next/error";
import ScoutingReportTemplate from "@components/templates/ScoutingReport";
import { ScoutingReportResult } from "@type/scoutingReport";
import Props from "@type/props";

export { getScoutingReportServerSideProps as getServerSideProps } from "@util/pageUtils";

const ScoutingReport = ({
  data,
  error,
}: Props<{
  error: { message: string };
  data: ScoutingReportResult;
}>): JSX.Element => {
  if (error?.message) {
    return <Error statusCode={404} />;
  }
  return <ScoutingReportTemplate data={data} />;
};

export default ScoutingReport;
