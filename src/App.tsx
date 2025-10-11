import { Box, Button, Image, Input, Text, Spinner } from "@chakra-ui/react";
import { useState, useRef } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Toaster, toaster } from "./components/ui/toaster";
import logo from "./assets/logo.png";
import { FintagClient } from "@fintag/js";
import bs58 from "bs58";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const App = () => {
  const AIRDROP_AMOUNT = 0.1;
  const LIMIT_INTERVAL = 60 * 1000; // 1 minute cooldown per request
  const lastRequestRef = useRef<number>(0);

  const fintag = new FintagClient(import.meta.env.VITE_FINTAG_URL, import.meta.env.VITE_FINTAG_API_KEY || "");

  // Load wallet from secret key stored in .env
  const faucetKeypair = Keypair.fromSecretKey(bs58.decode(import.meta.env.VITE_FAUCET_SECRET_KEY));

  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestAirdrop = async () => {
    const now = Date.now();

    // 1️⃣ Rate limit
    if (now - lastRequestRef.current < LIMIT_INTERVAL) {
      toaster.warning({
        title: "Slow down!",
        description: "Please wait a moment before requesting again.",
        duration: 3000,
      });
      return;
    }
    lastRequestRef.current = now;

    if (!value.startsWith("#")) {
      toaster.warning({
        title: "Invalid FinTag",
        description: "Please enter a valid FinTag starting with #",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // 2️⃣ Resolve FinTag to wallet
      const walletInfo = await fintag.getWalletInfo(value);
      if (!walletInfo?.wallet) throw new Error("Wallet not found for this FinTag");
      const recipientPubKey = new PublicKey(walletInfo.wallet);

      // 3️⃣ Check faucet balance
      const faucetBalance = await connection.getBalance(faucetKeypair.publicKey);
      if (faucetBalance < AIRDROP_AMOUNT * LAMPORTS_PER_SOL) {
        throw new Error("The faucet will be back soon! Try again later.");
      }

      // 4️⃣ Create and send transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: faucetKeypair.publicKey,
          toPubkey: recipientPubKey,
          lamports: AIRDROP_AMOUNT * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendAndConfirmTransaction(connection, transaction, [faucetKeypair]);

      console.log(`✅ Sent ${AIRDROP_AMOUNT} SOL to ${value}. Tx: ${signature}`);
      setValue("");
      toaster.success({
        title: "Airdrop Successful",
        description: `${AIRDROP_AMOUNT} SOL has been sent to ${value}`,
        duration: 3200,
      });
    } catch (error) {
      console.error("Airdrop failed:", error);
      toaster.error({
        title: "Airdrop Failed",
        description: error instanceof Error ? error.message : "Could not send SOL",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      onKeyUp={(e) => e.key === "Enter" && requestAirdrop()}
      overflowX="hidden"
      w="100%"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Toaster />
      <Box m="20px">
        <Image src={logo} alt="Fintag Logo" style={{ width: "60px", height: "60px" }} />
      </Box>
      <Text fontWeight="bold" textAlign="center" fontSize="24px" mb="20px">
        SOL Devnet Faucet
      </Text>

      <Box display="flex" w="100%" px="20px" flexDirection={{ base: "column", md: "row" }} alignItems="center" justifyContent="center" mt={4}>
        <Input
          placeholder="Enter your FinTag (e.g. #fintag123)"
          borderRadius="0"
          width={{ base: "100%", md: "400px" }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
        />
        <Button
          borderRadius="0"
          ml={{ base: "0", md: "5px" }}
          mt={{ base: "5px", md: "0" }}
          onClick={requestAirdrop}
          disabled={isLoading}
        >
          Request {AIRDROP_AMOUNT} SOL
          {isLoading && <Spinner size="sm" ml="5px" />}
        </Button>
      </Box>
    </Box>
  );
};

export default App;
