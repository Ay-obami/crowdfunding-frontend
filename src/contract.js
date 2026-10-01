export const CONTRACT_ADDRESS = "0x0B14BDDb6890202147D35C80C4C285165643D642";

export const CROWDFUND_ABI = [
  "function NextCampignId() view returns (uint256)",
  "function campaign(uint256) view returns (address creator, uint256 target, uint256 deadline, uint256 moneyRaised, uint256 moneyavailable, bool active, bool cancelled, address tokenAccepted)",
  "function contributors(uint256,address) view returns (uint256 amount)",
  "function createCampaign(uint256 _target, uint256 deadline, address tokenAccepted, uint256[] _amounts, uint8[] _statuses) returns (uint256 campaignId)",
  "function contributing(uint256 _amount, address _token, uint256 campaignId)",
  "function approveMilestones(uint256 campaignId) returns (bool success)",
  "function Withdrawal(uint256 campaignId)",
  "function refundMoney(uint256 campaignId)",
  "function cancelCampaign(uint256 campaignId)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
];