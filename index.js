//
// synternet-price-consumer : subscribe to synternet.price.all
//
import dotenv from "dotenv";
import { createAppJwt, NatsService } from "pubsub-js-synternet";
dotenv.config();
// Handle SIGINT (Ctrl+C) for graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Shutting down...");
  process.exit(0);
});
// Environment variables
const BROKER = process.env.SYNTERNET_BROKER || "broker-eu-01.synternet.com";
const SUBJECT = process.env.SYNTERNET_SUBJECT || "synternet.price.all";
const ACCESS_KEY = process.env.SYNTERNET_ACCESS_KEY || "SAAI7ICWXVC37N6LVRHD2EI3GUWJMU3E5SCGE43S26WGEFARMSR22R2HYI"
const PRETTY = process.env.PRETTY === "1" || process.env.PRETTY === "true";
//
// I know I know - the above ACCESS_KEY can only be used to pull synternet.price.all and is loaded with  only 5 dollars=500SYNT	
// and can deliver at most 500 months worth of streaming, so 500 people can simulatneously stream this 24/7 and consume all the 
// credits within a month. I don't mind speandin the $5 to let folks play with this stuff. After that, get your own synternet account
// and set the SYNTERNET_ACCESS_KEY in your .env. But for now and a for a little while, enjoy just running the docker and create 
// some clever UI and share with me!
// Ensure access key exists and starts with 'SAA'
if (!ACCESS_KEY || !ACCESS_KEY.startsWith("SAA")) {
  console.error(`
❌ Missing or invalid SYNTERNET_ACCESS_KEY.
The key must start with 'SAA'.
Please get your key by:
1. Create a Synternet project at https://portal.synternet.com/
2. Add the 'synternet.price.all' service
3. Click the '...' next to your project and select 'Reveal Access Key' and put it in the .env or specify in the -e SYNTERNET_ACCESS_KEY=SAA...
4. Make sure you have a few SYNT tokens to allocate and subscribe to 'synternet.price.all'
Then run this container with:
  docker run --rm -it synternet-price-consumer
or
  docker run --rm -it -e SYNTERNET_ACCESS_KEY=$SYNTERNET_ACCESS_KEY synternet-price-consumer
where $SYNTERNET_ACCESS_KEY is set to your revealed ACCESS KEY
`);
  process.exit(1);
}
async function main() {
  try {
    const service = new NatsService({
      url: BROKER,
      natsCredsFile: createAppJwt(ACCESS_KEY),
    });
    await service.waitForConnection();
    service.addHandler(SUBJECT, (encoded) => {
      const data = new TextDecoder().decode(encoded);
      
      // Clean the data and ensure it's a single JSON object per line
      const cleanData = data.trim().replace(/\r/g, '');
      
      try {
        // Parse to ensure it's valid JSON, then stringify to ensure clean output
        const jsonData = JSON.parse(cleanData);
        const output = PRETTY 
          ? JSON.stringify(jsonData, null, 2) 
          : JSON.stringify(jsonData);
        process.stdout.write(output + '\n');
      } catch (err) {
        console.error("Invalid JSON received:", cleanData);
      }
    });
    await service.serve();
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}
main();

