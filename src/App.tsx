import { Box, Button, Image, Input, Text} from "@chakra-ui/react"
import { useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Toaster, toaster } from "./components/ui/toaster";
import { Spinner } from "@chakra-ui/react";
import logo from './assets/logo.png';
import { FintagClient } from "@fintag/js";

const connection = new Connection(clusterApiUrl("testnet"), 'confirmed');

const App = () => {
  const AIRDROP_AMOUNT = 0.1;
  
  // Validate environment variables
  if (!import.meta.env.VITE_FINTAG_URL) {
    console.error("VITE_FINTAG_URL is not defined in environment variables");
  }
  if (!import.meta.env.VITE_FINTAG_API_KEY) {
    console.warn("VITE_FINTAG_API_KEY is not defined in environment variables");
  }
  
  const fintag = new FintagClient(import.meta.env.VITE_FINTAG_URL, import.meta.env.VITE_FINTAG_API_KEY || "")

  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [lastAirdropTime, setLastAirdropTime] = useState<number>(0);

  const requestAirdrop = async () => {
    if (!value) {
      console.error("FinTag is required");
      toaster.warning({
        title: "FinTag Required",
        description: "Please enter a FinTag to request an airdrop.",
        duration: 3000,
      });
      return;
    }

    // // Rate limiting check (24 hours = 86400000 ms)
    // const now = Date.now();
    // const timeSinceLastAirdrop = now - lastAirdropTime;
    // const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
    
    // if (timeSinceLastAirdrop < cooldownPeriod) {
    //   const hoursLeft = Math.ceil((cooldownPeriod - timeSinceLastAirdrop) / (60 * 60 * 1000));
    //   toaster.warning({
    //     title: "Rate Limit",
    //     description: `Please wait ${hoursLeft} more hours before requesting another airdrop.`,
    //     duration: 5000,
    //   });
    //   return;
    // }

    try {
      setIsLoading(true);
      // Check if input is a FinTag (starts with a hashtag)
      let publicKey;
      if (value.startsWith("#")) {
        const getPubKey = await fintag.getWalletInfo(value);
        publicKey = new PublicKey(getPubKey?.wallet);
      }
      else {
        return toaster.warning({
          title: "Invalid FinTag",
          description: "Please enter a valid FinTag starting with #",
          duration: 3000,
        })
      }
      const airdropSignature = await connection.requestAirdrop(publicKey, AIRDROP_AMOUNT * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSignature, 'confirmed');
      console.log(`Airdrop successful for ${value}`);
      
      // Update last airdrop time
      // setLastAirdropTime(Date.now());
      
      setValue("");
      toaster.success({
        title: "Airdrop Successful",
        description: `${AIRDROP_AMOUNT} SOL has been sent to ${value}`,
        duration: 3200,
      }); 
    } catch (error) {
      console.error("Airdrop failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      
      // Check for specific Solana errors
      let userFriendlyMessage = "Could not send SOL";
      if (errorMessage.includes("airdrop request failed")) {
        userFriendlyMessage = "Airdrop request failed. You may have exceeded the rate limit (1 request per 24h).";
      } else if (errorMessage.includes("429")) {
        userFriendlyMessage = "Rate limit exceeded. Please try again later.";
      } else if (errorMessage.includes("Invalid public key")) {
        userFriendlyMessage = "Invalid wallet address for this FinTag.";
      }
      
      toaster.error({
        title: "Airdrop Failed",
        description: userFriendlyMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box display='flex' onKeyUp={(e) => {
      if (e.key === 'Enter') {
        requestAirdrop();
      }
    }} overflowX='hidden' w='100%' flexDirection='column' alignItems='center' justifyContent='center' minHeight='100vh'>
      <Toaster />
      <Box m='20px'>
        <Image src={logo} alt="Fintag Logo" style={{ width: '60px', height: '60px' }} />
      </Box>
      <Box mb='20px'>
        <Text as="p" fontWeight='bold' textAlign='center' fontSize='24px'>
          SOL Testnet Faucet
        </Text>
      </Box>
      <Box display='flex' w='100%' px='20px' flexDirection={{ base: 'column', md: 'row' }} alignItems='center' justifyContent='center' mt={4}>
        <Input
          placeholder="Enter your FinTag"
          borderRadius='0'
          width={{base: '100%', md:'400px' }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
        />
        <Button borderRadius='0' ml={{base: '0', md:'5px'}} mt={{base: '5px', md:'0'}}
        onClick={requestAirdrop}
        disabled={isLoading}
        >
        Request {AIRDROP_AMOUNT} SOL
        {isLoading && <Spinner size='sm' ml='5px' />}
        </Button>
      </Box>
    </Box>
  )
}

export default App