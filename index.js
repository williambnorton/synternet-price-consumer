import dotenv from "dotenv";
import { createAppJwt, NatsService } from "pubsub-js-synternet";

dotenv.config();

// Use console.log for messages
console.log("➡️ Setting up SIGINT handler for graceful shutdown");

// Handle SIGINT (Ctrl+C) for graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Shutting down...");
  process.exit(0);
});

// Environment variables
const BROKER = process.env.SYNTERNET_BROKER || "broker-eu-01.synternet.com";
const SUBJECT = process.env.SYNTERNET_SUBJECT || "synternet.price.all";
const ACCESS_KEY = process.env.SYNTERNET_ACCESS_KEY;

// Ensure access key exists and starts with 'SAA'
if (!ACCESS_KEY || !ACCESS_KEY.startsWith("SAA")) {
  console.error(`
❌ Missing or invalid SYNTERNET_ACCESS_KEY.
The key must start with 'SAA'.
Please get your key by:
1. Create a Synternet project at https://portal.synternet.com/
2. Add the 'synternet.price.all' service
3. Click the '...' next to your project and select 'Reveal Access Key'
4. Make sure you have a few SYNT tokens to subscribe to 'synternet.price.all'
Then run this container with:
  docker run --rm -it -e SYNTERNET_ACCESS_KEY=YOUR_KEY synternet-price-consumer
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

    console.log(`✅ Connected to ${BROKER}`);
    console.log(`📡 Subscribed to subject: ${SUBJECT}`);

    service.addHandler(SUBJECT, (encoded) => {
      const data = new TextDecoder().decode(encoded);
      console.log(data);
    });

    await service.serve();
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

main();
