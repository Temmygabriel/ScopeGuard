"use client";
import { useState, useEffect, useCallback } from "react";
import type { Account, Brief, Profile, Screen } from "../types";
import { makeAccount, getMyBriefs, getProfile } from "../lib/contract";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import LandingScreen from "../components/LandingScreen";
import ImportKeyScreen from "../components/ImportKeyScreen";
import CreateBriefScreen from "../components/CreateBriefScreen";
import SignBriefScreen from "../components/SignBriefScreen";
import BriefDetail from "../components/BriefDetail";
import SubmitDeliveryScreen from "../components/SubmitDeliveryScreen";
import SubmitDisputeScreen from "../components/SubmitDisputeScreen";
import JudgingScreen from "../components/JudgingScreen";
import MyBriefsScreen from "../components/MyBriefsScreen";
import ExploreScreen from "../components/ExploreScreen";
import ProfileScreen from "../components/ProfileScreen";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myBriefs, setMyBriefs] = useState<Brief[]>([]);
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null);
  const [pendingSignBriefId, setPendingSignBriefId] = useState<string | null>(null);

  // pick up ?brief=BRF000001 from a link a freelancer shared, before
  // the account is ready so we know to route there once it is
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const briefParam = params.get("brief");
    if (briefParam) {
      setPendingSignBriefId(briefParam);
    }
  }, []);

  // account bootstrap — generates a key on first visit, reuses it after
  useEffect(() => {
    let acc: Account;
    const savedKey = localStorage.getItem("sg_private_key");
    try {
      if (savedKey && savedKey !== "undefined" && savedKey !== "null" && savedKey.startsWith("0x")) {
        acc = makeAccount(savedKey as `0x${string}`);
      } else {
        acc = makeAccount();
        localStorage.setItem("sg_private_key", acc.privateKey);
      }
    } catch {
      localStorage.removeItem("sg_private_key");
      acc = makeAccount();
      localStorage.setItem("sg_private_key", acc.privateKey);
    }
    localStorage.setItem("sg_address", acc.address);
    setAccount(acc);
    setName(localStorage.getItem("sg_name") || "");
  }, []);

  const loadProfile = useCallback(async (address: string, silent = false) => {
    try {
      const p = await getProfile(address);
      setProfile(p);
    } catch (err) {
      if (!silent) console.error("Could not load profile", err);
    }
  }, []);

  const loadMyBriefs = useCallback(async (address: string) => {
    try {
      const briefs = await getMyBriefs(address);
      setMyBriefs(briefs);
    } catch {
      // new address, nothing to show yet — not an error
    }
  }, []);

  useEffect(() => {
    if (!account) return;
    loadProfile(account.address, true); // silent — new users never see an error here
    loadMyBriefs(account.address);
    if (pendingSignBriefId) {
      setActiveBriefId(pendingSignBriefId);
      setScreen("sign_brief");
      setPendingSignBriefId(null);
    }
  }, [account]);

  function handleImportKey(privateKey: `0x${string}`) {
    localStorage.setItem("sg_private_key", privateKey);
    const acc = makeAccount(privateKey);
    localStorage.setItem("sg_address", acc.address);
    setAccount(acc);
    setScreen("landing");
  }

  function goTo(next: Screen) {
    setScreen(next);
  }

  function openBrief(briefId: string) {
    setActiveBriefId(briefId);
    setScreen("brief_detail");
  }

  let content: React.ReactNode;
  switch (screen) {
    case "landing":
      content = (
        <LandingScreen
          profile={profile}
          onCreateBrief={() => goTo("create_brief")}
          onImportKey={() => goTo("import_key")}
        />
      );
      break;
    case "import_key":
      content = <ImportKeyScreen onImport={handleImportKey} onCancel={() => goTo("landing")} />;
      break;
    case "create_brief":
      content = account && (
        <CreateBriefScreen
          account={account}
          name={name}
          onSaveName={(n) => {
            localStorage.setItem("sg_name", n);
            setName(n);
          }}
          onCreated={() => loadMyBriefs(account.address)}
          onDone={() => goTo("my_briefs")}
        />
      );
      break;
    case "sign_brief":
      content = account && activeBriefId && (
        <SignBriefScreen
          account={account}
          briefId={activeBriefId}
          onSigned={() => {
            loadMyBriefs(account.address);
            goTo("brief_detail");
          }}
          onDone={() => goTo("landing")}
        />
      );
      break;
    case "brief_detail":
      content = account && activeBriefId && (
        <BriefDetail
          account={account}
          briefId={activeBriefId}
          onBack={() => goTo("my_briefs")}
          onSubmitDelivery={(id) => {
            setActiveBriefId(id);
            goTo("submit_delivery");
          }}
          onSubmitDispute={(id) => {
            setActiveBriefId(id);
            goTo("submit_dispute");
          }}
          onJudging={(id) => {
            setActiveBriefId(id);
            goTo("judging");
          }}
        />
      );
      break;
    case "submit_delivery":
      content = account && activeBriefId && (
        <SubmitDeliveryScreen
          account={account}
          briefId={activeBriefId}
          onSubmitted={() => {
            loadMyBriefs(account.address);
            goTo("brief_detail");
          }}
          onCancel={() => goTo("brief_detail")}
        />
      );
      break;
    case "submit_dispute":
      content = account && activeBriefId && (
        <SubmitDisputeScreen
          account={account}
          briefId={activeBriefId}
          onSubmitted={() => {
            loadMyBriefs(account.address);
            goTo("brief_detail");
          }}
          onCancel={() => goTo("brief_detail")}
        />
      );
      break;
    case "judging":
      content = account && activeBriefId && (
        <JudgingScreen
          account={account}
          briefId={activeBriefId}
          onResolved={() => {
            loadMyBriefs(account.address);
            loadProfile(account.address, true);
            goTo("brief_detail");
          }}
        />
      );
      break;
    case "my_briefs":
      content = account && (
        <MyBriefsScreen
          briefs={myBriefs}
          account={account}
          onOpen={(id) => openBrief(id)}
          onCreateNew={() => goTo("create_brief")}
        />
      );
      break;
    case "explore":
      content = <ExploreScreen onOpen={(id) => openBrief(id)} />;
      break;
    case "profile":
      content = account && (
        <ProfileScreen
          account={account}
          profile={profile}
          name={name}
          onSaveName={(n) => {
            localStorage.setItem("sg_name", n);
            setName(n);
          }}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <div className="app-shell">
      <Sidebar screen={screen} onNavigate={goTo} />
      <div className="app-content">{content}</div>
      <BottomNav screen={screen} onNavigate={goTo} />
    </div>
  );
}
