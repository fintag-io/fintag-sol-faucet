import { Box, Button, Image, Input, Text} from "@chakra-ui/react"
import { useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Toaster, toaster } from "./components/ui/toaster";
import { Spinner } from "@chakra-ui/react";
import logo from './assets/logo.png';
import { FintagClient } from "@fintag/js";

const connection = new Connection(clusterApiUrl("devnet"), 'confirmed');

const App = () => {
  const AIRDROP_AMOUNT = 0.1;
  const fintag = new FintagClient(import.meta.env.VITE_FINTAG_URL, import.meta.env.VITE_FINTAG_API_KEY || "")

  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      setValue("");
      toaster.success({
        title: "Airdrop Successful",
        description: `${AIRDROP_AMOUNT} SOL has been sent to ${value}`,
        duration: 3200,
      }); 
    } catch (error) {
      console.error("Airdrop failed:", error);
      // const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toaster.error({
        title: "Airdrop Failed",
        description: `Could not send SOL`,
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
          SOL Devnet Faucet
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