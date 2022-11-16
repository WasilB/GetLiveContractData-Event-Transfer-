var CronJob = require("cron").CronJob;
const dotenv = require("dotenv");
dotenv.config();
const Web3 = require("web3");
const rpcURL = "https://mainnet.infura.io/v3/21d1df8208a048dfa2fa3acf5ba3776b";
const web3 = new Web3(rpcURL);

//connect databse
const { Client } = require("pg");
const connectDb = async () => {
  try {
    const client = new Client({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
    });

    await client.connect(); //connect to database
    const fromBlock = await client.query("SELECT fromblock FROM blocknumber"); //get fromblock from database

    let fromBlockNumber = parseInt(fromBlock.rows[0].fromblock); //convert fromblock to integer

    console.log(`fromBlockNumber: ${fromBlockNumber}`);

    let toBlockNumber = fromBlockNumber + 200;

    const CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const CONTRACT_ABI = require("./abi");
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    //get all events from contract (iterate through each transaction)
    function getTransferDetails(data_events) {
      for (i = 0; i < data_events.length; i++) {
        let from = data_events[i]["returnValues"]["from"]; // gets the from address
        let to = data_events[i]["returnValues"]["to"];
        let amount = data_events[i]["returnValues"]["value"];

        let converted_amount = web3.utils.fromWei(amount, "ether"); //converts the amount to ether

        console.log("From:", from, "- To:", to, "- Value:", converted_amount);
      }
    }

    async function getEvents() {
      let latest_block = await web3.eth.getBlockNumber(); //gets the latest block number

      if (fromBlockNumber > latest_block) {
        console.log("No new blocks");
        toBlockNumber = latest_block;
        fromBlockNumber = latest_block;
      } else {
      }

      console.log(
        "latest: ",
        latest_block,
        "historical block: ",
        fromBlockNumber
      );

      console.log("from: ", fromBlockNumber, "to: ", toBlockNumber);
      const events = await contract.getPastEvents(
        "Transfer", // change if your looking for a different event
        { fromBlock: fromBlockNumber, toBlock: toBlockNumber }
      );

      await getTransferDetails(events);
      client.query(`UPDATE blocknumber SET fromblock = ${toBlockNumber + 1}`);
    }

    await getEvents();
    // await client.end();
  } catch (error) {
    console.log(error);
  }
};

var job = new CronJob(
  "*/20 * * * * *",
  function () {
    console.log("CRON STARTED");
    console.log("WILL RUN EVERY 10 SECONDS");
    connectDb();
  },
  null,
  true,
  "America/Los_Angeles"
);
job.start();
