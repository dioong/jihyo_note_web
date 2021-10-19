import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/dist/client/router";
import _ from "lodash";
import { useTheme } from "styled-components";
import { useDeepCompareEffect } from "use-deep-compare";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import ProfileTemplate from "@components/templates/Profile";
import Profile from "@components/organism/Profile";
import Navigation from "@components/organism/Navigation";
import DiffStats from "@components/organism/DiffStats";
import MatchList from "@components/organism/MatchList";
import { GameMode, regionsDropdown } from "@type/constant";
import useProfile from "@hooks/useProfile";
import useMatches from "@hooks/useMatches";
import { ProfileQuery, SimpleSummoner } from "@type/profile";
import useProfileSearch from "@hooks/useProfileSearch";
import { SummonerProfile } from "@type/api";
import ProfileHeader from "@components/organism/ProfileHeader";
import useProfileNavigate from "@hooks/useProfileNavigate";
import ChallengerStory from "@components/organism/ChallengerStory";
import parseProfileQuery, {
  parseSubfilter,
  ProfileParams,
} from "@util/profileQueryParser";
import { event } from "@util/ga";
import { PageProps } from "@util/pageUtils";
import ABTestVariantsProvider, {
  mapExperimentKeyToTicketNumber,
} from "@context/ABTestContext";
import {
  isChampionProfile,
  isLaneProfile,
  isSummonerProfile,
} from "@util/profile";

export { getServerSideProps } from "@util/pageUtils";
function useProfileTitle(query: ProfileQuery): string {
  const { t } = useTranslation();

  const getProfileText = useCallback(
    (profile: ProfileParams) => {
      switch (profile.type) {
        case "Summoner":
          return profile.name ?? "";
        case "Lane":
          return `${profile.filter} ${t(
            `common:laneColloquial.${profile.name}`
          )}`;
        case "Champion":
          return `${profile.filter} ${t(`champions:${profile.name}`)}`;
        default:
          return "";
      }
    },
    [t]
  );

  return useMemo(() => {
    const leftText = getProfileText(parseProfileQuery(query, "left"));
    const rightText = getProfileText(parseProfileQuery(query, "right"));

    return `${[leftText, rightText].filter(_.identity).join(" VS ")} ${t(
      "common:compare"
    )}`;
  }, [getProfileText, query, t]);
}

const ProfilePage: React.FC<PageProps> = ({ variants }) => {
  const router = useRouter();
  const profileQuery = router.query as ProfileQuery;
  const { platform } = useTheme();
  const { navigate } = useProfileNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("SoloRank");
  const [championFilter, setChampionFilter] = useState("");
  const [summonerFilter, setSummonerFilter] = useState<SimpleSummoner>({
    name: "",
    region: "",
  });

  const [summoners, setSummoners] = useState<SimpleSummoner[]>([]);

  const matches = useMatches({
    name: summonerFilter.name,
    champion: championFilter,
    matchCategory: gameMode,
    region: summonerFilter.region,
  });

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

  const leftProfile = useProfile(profileQuery, "left", matches.revalidate);
  const rightProfile = useProfile(profileQuery, "right", matches.revalidate);

  const title = useProfileTitle(profileQuery);

  const activeSummonerProfile = useMemo(() => {
    if (summonerFilter.name === (leftProfile.profile as SummonerProfile)?.name)
      return leftProfile;
    if (summonerFilter.name === (rightProfile.profile as SummonerProfile)?.name)
      return rightProfile;
    return null;
  }, [summonerFilter, leftProfile, rightProfile]);

  const activeSummonerUpdate = useCallback(
    () => activeSummonerProfile?.update(),
    [activeSummonerProfile]
  );

  const activeSummonerIsUpdating = useMemo(() => {
    if (!activeSummonerProfile) return false;
    return activeSummonerProfile.isUpdating;
  }, [activeSummonerProfile]);

  useEffect(() => {
    // 좌측 프로필 기준으로 우측 모스트 챔피언(라인) 디폴트 값 설정
    if (rightProfile.secondaryFilter) return;
    // 좌측 프로필이 라인 프로필일 땐 all이 있어서 예외처리
    if (!leftProfile.secondaryFilter && !isLaneProfile(leftProfile.profile))
      return;

    const lane = (() => {
      const [parsedLane] = parseSubfilter(leftProfile.secondaryFilter);
      return parsedLane ?? leftProfile.profile?.lane;
    })();

    if (
      (isSummonerProfile(rightProfile.profile) ||
        isChampionProfile(rightProfile.profile)) &&
      rightProfile.profile.mostLanes?.length
    ) {
      if (rightProfile.profile.mostLanes.some((e) => e.lane === lane))
        rightProfile.setSecondaryFilter(lane as string, "replace");
      else
        rightProfile.setSecondaryFilter(
          rightProfile.profile.mostLanes[0].lane as string,
          "replace"
        );
    }
  }, [leftProfile.profile, leftProfile.secondaryFilter, rightProfile]);

  useEffect(() => {
    // 매치 리스트의 큐 타입과 프로필의 큐 타입 동기화하기
    if (!activeSummonerProfile?.primaryFilter) return;
    setGameMode(activeSummonerProfile.primaryFilter as GameMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSummonerProfile?.primaryFilter]);

  useEffect(() => {
    // 검색을 통해 들어왔을 경우, 오른쪽 프로필 자동으로 채워주기
    if (rightProfile.type) return;
    if (!leftProfile.profile || leftProfile.type !== "Summoner") return;

    const profile = leftProfile.profile as SummonerProfile;
    if (profile.competitor?.name === "Any") return;

    const rightFilter =
      profile.competitor?.type !== "Summoner"
        ? profile.competitor?.tier
        : undefined;

    navigate({
      right: {
        type: profile.competitor?.type,
        name: profile.competitor?.name,
        filter: rightFilter,
        region: profile.region,
      },
      routingMode: "replace",
    });
  }, [
    leftProfile.name,
    leftProfile.profile,
    leftProfile.type,
    navigate,
    rightProfile.type,
  ]);

  useEffect(() => {
    // 매치 리스트 헤더에서 노출할 소환사명 설정하기
    const summonersFromProfile: SimpleSummoner[] = [];
    if (leftProfile?.profile?.type === "Summoner")
      summonersFromProfile.push({
        name: (leftProfile?.profile as SummonerProfile)?.name ?? "",
        region: (leftProfile?.profile as SummonerProfile)?.region ?? "",
      });
    if (rightProfile?.profile?.type === "Summoner")
      summonersFromProfile.push({
        name: (rightProfile?.profile as SummonerProfile)?.name ?? "",
        region: (rightProfile?.profile as SummonerProfile)?.region ?? "",
      });

    setSummoners(
      _.uniqBy(
        summonersFromProfile,
        (summoner) => summoner.name + summoner.region
      )
    );
  }, [leftProfile.profile, rightProfile.profile]);

  useDeepCompareEffect(() => {
    // 검색되어 보여지고 있는 소환사 프로필이 변경되면 매치 리스트에서 활성화된 소환사 초기화하기
    if (summoners.length === 0) return;
    setSummonerFilter({
      name: summoners[0].name,
      region: summoners[0].region,
    });
  }, [summoners]);

  useEffect(() => {
    // 매치리스트의 큐 타입 혹은 활성화된 사용자가 변경되면 챔피언 필터 초기화하기
    setChampionFilter("");
  }, [gameMode, summonerFilter]);

  const abTest = mapExperimentKeyToTicketNumber(variants);

  return (
    <ABTestVariantsProvider abTest={abTest}>
      <Head>
        <title>KDA.AI - {title}</title>
      </Head>
      <ProfileTemplate
        navigation={
          <Navigation regions={regionsDropdown} search={profileSearchWithGa} />
        }
        header={<ProfileHeader left={leftProfile} right={rightProfile} />}
        leftProfile={
          <Profile
            data={leftProfile}
            region={leftProfile.profile?.region ?? "kr"}
          />
        }
        diff={
          <DiffStats leftProfile={leftProfile} rightProfile={rightProfile} />
        }
        rightProfile={
          <Profile
            data={rightProfile}
            region={rightProfile.profile?.region ?? "kr"}
            reverse
          />
        }
        matchUp={platform === "mobile" && <ChallengerStory region="kr" />}
      >
        {summoners.length > 0 && (
          <MatchList
            matches={matches.matches}
            champions={matches.champions}
            loading={matches.loading}
            update={activeSummonerUpdate}
            isUpdating={activeSummonerIsUpdating}
            gameMode={gameMode}
            setGameMode={setGameMode}
            championFilter={championFilter}
            setChampionFilter={setChampionFilter}
            summoners={summoners}
            activeSummoner={summonerFilter}
            setSummoner={setSummonerFilter}
          />
        )}
      </ProfileTemplate>
    </ABTestVariantsProvider>
  );
};

export default ProfilePage;
