var CronJob = require("cron").CronJob;

const Web3 = require("web3");
const rpcURL = "https://mainnet.infura.io/v3/21d1df8208a048dfa2fa3acf5ba3776b";
const web3 = new Web3(rpcURL);

const CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const CONTRACT_ABI = require("./abi");
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

async function getEvents() {
  let latest_block = await web3.eth.getBlockNumber();
  let historical_block = latest_block; // you can also change the value to 'latest' to get the latest block
  console.log("latest: ", latest_block, "historical block: ", historical_block);
  const events = await contract.getPastEvents(
    "Transfer", // change if your looking for a different event
    { fromBlock: historical_block, toBlock: latest_block }
  );

  await getTransferDetails(events);
}

async function getTransferDetails(data_events) {
  for (i = 0; i < data_events.length; i++) {
    let from = data_events[i]["returnValues"]["from"];
    let to = data_events[i]["returnValues"]["to"];
    let amount = await data_events[i]["returnValues"]["value"];

    let converted_amount = web3.utils.fromWei(amount, "ether");

    console.log("From:", from, "- To:", to, "- Value:", converted_amount);
  }
}
var job = new CronJob(
  "*/15 * * * * *",
  function () {
    getEvents();
  },
  null,
  true,
  "America/Los_Angeles"
);
job.start();
