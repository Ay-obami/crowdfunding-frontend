import { useState } from "react";
import { BrowserProvider, Contract, isAddress } from "ethers";
import { CONTRACT_ADDRESS, CROWDFUND_ABI, ERC20_ABI } from "./contract";
import "./App.css";

const SEPOLIA_CHAIN_ID = 11155111;

function errorText(error) {
  return error?.shortMessage || error?.reason || error?.message || "Something went wrong.";
}

function splitBigInts(value) {
  return value.trim() ? value.split(",").map((item) => BigInt(item.trim())) : [];
}

function splitStatuses(value) {
  return value.trim() ? value.split(",").map((item) => Number(item.trim())) : [];
}

export default function App() {
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const [nextId, setNextId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaignData, setCampaignData] = useState(null);
  const [contributorCampaignId, setContributorCampaignId] = useState("");
  const [contributorAddress, setContributorAddress] = useState("");
  const [contribution, setContribution] = useState("");

  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tokenAccepted, setTokenAccepted] = useState("");
  const [milestoneAmounts, setMilestoneAmounts] = useState("");
  const [milestoneStatuses, setMilestoneStatuses] = useState("");

  const [contributeId, setContributeId] = useState("");
  const [contributeToken, setContributeToken] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");
  const [approveId, setApproveId] = useState("");
  const [withdrawId, setWithdrawId] = useState("");
  const [refundId, setRefundId] = useState("");
  const [cancelId, setCancelId] = useState("");

  async function connectWallet() {
    try {
      setMessage("");
      if (!window.ethereum) throw new Error("MetaMask is required.");

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      }

      const nextProvider = new BrowserProvider(window.ethereum);
      const nextSigner = await nextProvider.getSigner();

      setSigner(nextSigner);
      setAccount(await nextSigner.getAddress());
      setMessage("Wallet connected on Sepolia.");
    } catch (error) {
      setMessage(errorText(error));
    }
  }

  function contract() {
    if (!signer) throw new Error("Connect your wallet first.");
    return new Contract(CONTRACT_ADDRESS, CROWDFUND_ABI, signer);
  }

  async function runWrite(label, action) {
    try {
      setMessage(label);
      setTxHash("");
      const tx = await action();
      setTxHash(tx.hash);
      setMessage("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setMessage("Transaction confirmed.");
    } catch (error) {
      setMessage(errorText(error));
    }
  }

  async function readNextId() {
    try {
      setMessage("");
      const value = await contract().NextCampignId();
      setNextId(value.toString());
    } catch (error) {
      setMessage(errorText(error));
    }
  }

  async function readCampaign() {
    try {
      setMessage("");
      const value = await contract().campaign(BigInt(campaignId));
      setCampaignData({
        creator: value.creator,
        target: value.target.toString(),
        deadline: value.deadline.toString(),
        moneyRaised: value.moneyRaised.toString(),
        moneyAvailable: value.moneyavailable.toString(),
        active: value.active ? "true" : "false",
        cancelled: value.cancelled ? "true" : "false",
        tokenAccepted: value.tokenAccepted,
      });
    } catch (error) {
      setMessage(errorText(error));
    }
  }

  async function readContribution() {
    try {
      setMessage("");
      if (!isAddress(contributorAddress)) throw new Error("Enter a valid contributor address.");
      const value = await contract().contributors(BigInt(contributorCampaignId), contributorAddress);
      setContribution(value.toString());
    } catch (error) {
      setMessage(errorText(error));
    }
  }

  async function createCampaign(event) {
    event.preventDefault();

    try {
      if (!isAddress(tokenAccepted)) throw new Error("Enter a valid token address.");

      const unixDeadline = Math.floor(new Date(deadline).getTime() / 1000);
      const amounts = splitBigInts(milestoneAmounts);
      const statuses = splitStatuses(milestoneStatuses);

      if (!unixDeadline || unixDeadline <= Math.floor(Date.now() / 1000)) {
        throw new Error("Deadline must be in the future.");
      }
      if (amounts.length === 0 || amounts.length !== statuses.length) {
        throw new Error("Milestone amounts and statuses must have the same length.");
      }
      if (statuses.some((status) => ![0, 1, 2].includes(status))) {
        throw new Error("Milestone statuses can only be 0, 1, or 2.");
      }

      await runWrite("Creating campaign...", () =>
        contract().createCampaign(BigInt(target), BigInt(unixDeadline), tokenAccepted, amounts, statuses)
      );
    } catch (error) {
      setMessage(errorText(error));
    }
  }

  async function contribute(event) {
    event.preventDefault();

    try {
      if (!signer) throw new Error("Connect your wallet first.");
      if (!isAddress(contributeToken)) throw new Error("Enter a valid token address.");

      setMessage("Approving token amount...");
      setTxHash("");

      const token = new Contract(contributeToken, ERC20_ABI, signer);
      const approval = await token.approve(CONTRACT_ADDRESS, BigInt(contributeAmount));
      await approval.wait();

      await runWrite("Sending contribution...", () =>
        contract().contributing(BigInt(contributeAmount), contributeToken, BigInt(contributeId))
      );
    } catch (error) {
      setMessage(errorText(error));
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Sepolia</p>
          <h1>CrowdFunding Frontend</h1>
          <p className="contract-address">{CONTRACT_ADDRESS}</p>
        </div>
        <button onClick={connectWallet}>
          {account || "Connect Wallet"}
        </button>
      </header>

      <div className="notice">
        <strong>Amounts use raw token units.</strong> Milestone status: 0 = early, 1 = medium, 2 = late.
      </div>

      {message && <p className="message">{message}</p>}
      {txHash && <p className="tx">Tx: {txHash}</p>}

      <section>
        <h2>Read Functions</h2>
        <div className="grid">
          <article className="card">
            <h3>Next Campaign ID</h3>
            <button onClick={readNextId}>Read NextCampignId</button>
            {nextId !== "" && <p className="result">{nextId}</p>}
          </article>

          <article className="card">
            <h3>Campaign</h3>
            <input type="number" min="0" placeholder="Campaign ID" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} />
            <button onClick={readCampaign} disabled={campaignId === ""}>Read campaign</button>
            {campaignData && (
              <div className="result list">
                <span>Creator: {campaignData.creator}</span>
                <span>Target: {campaignData.target}</span>
                <span>Deadline: {campaignData.deadline}</span>
                <span>Money raised: {campaignData.moneyRaised}</span>
                <span>Money available: {campaignData.moneyAvailable}</span>
                <span>Active: {campaignData.active}</span>
                <span>Cancelled: {campaignData.cancelled}</span>
                <span>Token: {campaignData.tokenAccepted}</span>
              </div>
            )}
          </article>

          <article className="card">
            <h3>Contributor</h3>
            <input type="number" min="0" placeholder="Campaign ID" value={contributorCampaignId} onChange={(e) => setContributorCampaignId(e.target.value)} />
            <input placeholder="Contributor address" value={contributorAddress} onChange={(e) => setContributorAddress(e.target.value)} />
            <button onClick={readContribution} disabled={!contributorCampaignId || !contributorAddress}>Read contributors</button>
            {contribution !== "" && <p className="result">Amount: {contribution}</p>}
          </article>
        </div>
      </section>

      <section>
        <h2>Write Functions</h2>
        <div className="grid">
          <article className="card wide">
            <h3>Create Campaign</h3>
            <form onSubmit={createCampaign}>
              <input type="number" min="1" placeholder="Target amount" value={target} onChange={(e) => setTarget(e.target.value)} required />
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
              <input placeholder="Accepted token address" value={tokenAccepted} onChange={(e) => setTokenAccepted(e.target.value)} required />
              <input placeholder="Milestone amounts, e.g. 100,200,300" value={milestoneAmounts} onChange={(e) => setMilestoneAmounts(e.target.value)} required />
              <input placeholder="Statuses, e.g. 0,1,2" value={milestoneStatuses} onChange={(e) => setMilestoneStatuses(e.target.value)} required />
              <button type="submit">createCampaign</button>
            </form>
          </article>

          <article className="card">
            <h3>Contribute</h3>
            <form onSubmit={contribute}>
              <input type="number" min="0" placeholder="Campaign ID" value={contributeId} onChange={(e) => setContributeId(e.target.value)} required />
              <input placeholder="Token address" value={contributeToken} onChange={(e) => setContributeToken(e.target.value)} required />
              <input type="number" min="1" placeholder="Amount" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} required />
              <button type="submit">contributing</button>
            </form>
          </article>

          <ActionCard title="Approve Milestones" button="approveMilestones" value={approveId} setValue={setApproveId} onClick={() => runWrite("Approving milestones...", () => contract().approveMilestones(BigInt(approveId)))} />
          <ActionCard title="Withdraw" button="Withdrawal" value={withdrawId} setValue={setWithdrawId} onClick={() => runWrite("Withdrawing milestone...", () => contract().Withdrawal(BigInt(withdrawId)))} />
          <ActionCard title="Refund" button="refundMoney" value={refundId} setValue={setRefundId} onClick={() => runWrite("Requesting refund...", () => contract().refundMoney(BigInt(refundId)))} />
          <ActionCard title="Cancel Campaign" button="cancelCampaign" value={cancelId} setValue={setCancelId} onClick={() => runWrite("Cancelling campaign...", () => contract().cancelCampaign(BigInt(cancelId)))} />
        </div>
      </section>
    </main>
  );
}

function ActionCard({ title, button, value, setValue, onClick }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <input type="number" min="0" placeholder="Campaign ID" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={onClick} disabled={value === ""}>{button}</button>
    </article>
  );
}